from collections.abc import Sequence
from datetime import datetime
from typing import cast

from snuba_sdk import MetricsQuery, MetricsScope, Rollup

from sentry import features
from sentry.models.environment import Environment
from sentry.models.organization import Organization
from sentry.models.project import Project
from sentry.sentry_metrics.querying.data.execution import QueryExecutor, QueryResult
from sentry.sentry_metrics.querying.data.parsing import QueryParser
from sentry.sentry_metrics.querying.data.preparation.base import (
    IntermediateQuery,
    run_preparation_steps,
)
from sentry.sentry_metrics.querying.data.preparation.units_normalization import (
    UnitsNormalizationStep,
)
from sentry.sentry_metrics.querying.data.query import MQLQueriesResult, MQLQuery
from sentry.sentry_metrics.querying.types import QueryType
from sentry.sentry_metrics.querying.visitors.query_modulator import QueryModulationStep

modulators = []


def run_queries(
    mql_queries: Sequence[MQLQuery],
    start: datetime,
    end: datetime,
    interval: int,
    organization: Organization,
    projects: Sequence[Project],
    environments: Sequence[Environment],
    referrer: str,
    query_type: QueryType = QueryType.TOTALS_AND_SERIES,
) -> MQLQueriesResult:
    """
    Runs a list of MQLQuery(s) that are executed in Snuba.

    Returns:
        A MQLQueriesResult object which encapsulates the results of the plan and allows a QueryTransformer
        to be run on the data.
    """
    # We build the basic query that contains the metadata which will be shared across all queries.
    base_query = MetricsQuery(
        start=start,
        end=end,
        rollup=Rollup(interval),
        scope=MetricsScope(
            org_ids=[organization.id],
            project_ids=[project.id for project in projects],
        ),
    )

    intermediate_queries = []
    compiled_mql_queries = []
    # We parse the query plan and obtain a series of queries.
    parser = QueryParser(projects=projects, environments=environments, mql_queries=mql_queries)

    for query_expression, compiled_mql_query in parser.generate_queries():
        intermediate_queries.append(
            IntermediateQuery(
                metrics_query=base_query.set_query(query_expression),
                order=compiled_mql_query.order,
                limit=compiled_mql_query.limit,
            )
        )
        compiled_mql_queries.append(compiled_mql_query)

    preparation_steps = []
    if features.has(
        "organizations:ddm-metrics-api-unit-normalization", organization=organization, actor=None
    ):
        preparation_steps.append(UnitsNormalizationStep())
        preparation_steps.append(QueryModulationStep(modulators, projects))

        # replace names and values in query

    # We run a series of preparation steps which operate on the entire list of queries.
    intermediate_queries = run_preparation_steps(intermediate_queries, *preparation_steps)

    # We prepare the executor, that will be responsible for scheduling the execution of multiple queries.
    executor = QueryExecutor(organization=organization, projects=projects, referrer=referrer)
    for intermediate_query in intermediate_queries:
        executor.schedule(intermediate_query=intermediate_query, query_type=query_type)

    results = executor.execute()

    # this is where the query results are adapted to transform into the format that the query expected
    for result in results:
        for element in result.series:
            # we don't actually see in the series_query whether there was a project-slug-filter in the original query -> we have to share some state.
            pass

    # We wrap the result in a class that exposes some utils methods to operate on results.
    return MQLQueriesResult(cast(list[QueryResult], results))
