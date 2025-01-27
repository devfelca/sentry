import styled from '@emotion/styled';
import {motion} from 'framer-motion';

import testableTransition from 'sentry/utils/testableTransition';

function WelcomeBackground() {
  return (
    <Container
      variants={{
        animate: {},
        exit: {},
      }}
      transition={testableTransition({staggerChildren: 0.2})}
    >
      <Compass
        xmlns="http://www.w3.org/2000/svg"
        width="150"
        viewBox="0 0 143.7 123.4"
        variants={{
          initial: {
            opacity: 0,
            scale: 0.9,
          },
          animate: {
            opacity: 1,
            scale: 1,
            transition: testableTransition({duration: 0.5}),
          },
          exit: {y: -120, opacity: 0},
        }}
        transition={testableTransition({duration: 0.9})}
      >
        <path
          d="M141 47c-2-10-18-22-26-26s-21-9-40-8-31 8-31 8l-2-1c7-5 8-11 8-13s-4-6-13-6-22 2-29 9-10 19 0 21 24-4 24-4l4 2-7 11-7 28c-2 17 5 26 12 33 8 8 32 23 68 19 29-3 34-15 37-18s3-10 3-10l1-32c0-6 0-7-2-13ZM39 15s-8 1-9 7l1 1s-10 3-16 2-9-2-6-8S22 7 22 7a49 49 0 0 1 14-2c7-1 9 2 9 3s0 5-4 10Z"
          fill="#fff"
        />
        <path
          d="m20 79 7-18s7 38 67 38c30 1 44-13 50-27l-1 27s-10 21-44 24c-30 3-72-11-79-44Z"
          fill="#b29dd2"
          opacity=".5"
        />
        <path d="M31 23a10 10 0 0 1 4-5s6 6 6 6a36 36 0 0 0-5 4Z" fill="#e7e1ec" />
        <path
          d="M31 26s-13 3-22 0c-9-4 0-12 5-15a36 36 0 0 1 29-4c2 0 4 2 3 0-1-3-6-5-15-4-7 0-18 5-22 8-7 5-11 11-8 16 2 7 13 6 17 5s11-3 13-6Zm7 29s-4-12 9-24 38-10 55-5c20 6 29 19 30 26 2 6 0 13 0 13s-3-19-21-27c-19-8-33-8-44-6s-20 7-29 23Z"
          fill="#b29dd2"
          opacity=".5"
        />
        <path fill="#ebb432" d="M62 33v17l21-9-21-8zm35 41 18-9 2 15-20-6z" />
        <path
          fill="#e1557a"
          d="m102 48 5 5 6-1 6-3-1-4-4-4-6 1-5 1-1 5zM52 72l1-5 5-2h7l4 4-1 5-5 3h-5l-6-5z"
        />
        <path
          d="M12 32a17 17 0 0 1-6-1c-3-1-5-3-6-7 0-5 4-12 11-17 10-7 25-8 31-6 6 1 9 4 9 7s-4 8-8 12a1 1 0 0 1-1 0 1 1 0 0 1 0-1c5-4 8-9 8-11 0-3-3-5-8-6-6-2-21 0-30 6C5 12 1 19 1 24c1 3 2 5 5 6 10 4 28-5 29-5a1 1 0 0 1 0 1c-1 0-13 6-23 6Z"
          fill="#2f1d4a"
        />
        <path
          d="M16 26c-5 0-8-2-9-5a1 1 0 0 1 1 0c0 3 4 4 9 4 11-1 16-3 16-3a3 3 0 0 1 2 0 3 3 0 0 1 1 1 1 1 0 0 1 0 1 2 2 0 0 0-1-1 2 2 0 0 0-1 0l-17 3Zm-7-8H8a1 1 0 0 1 0-1c3-5 10-10 17-11 8-2 18-3 20 1 2 2 0 6-2 9a1 1 0 0 1-1 1v-1c1-2 4-7 2-9-2-3-11-2-18 0-8 1-14 6-17 11Z"
          fill="#2f1d4a"
        />
        <path
          d="M30 23a1 1 0 0 1-1-1s2-7 10-8l5 7a1 1 0 0 1 0 1 1 1 0 0 1-1 0l-4-7c-8 1-9 7-9 7a1 1 0 0 1 0 1Zm6 6a1 1 0 0 1-1 0l-1-1v-1l2 1a1 1 0 0 1 0 1Z"
          fill="#2f1d4a"
        />
        <path
          d="M94 98a119 119 0 0 1-22-3c-42-7-46-40-46-40-1-9 3-23 16-33 10-8 28-12 47-9a80 80 0 0 1 11 2 1 1 0 0 1 0 1 1 1 0 0 1-1 0 78 78 0 0 0-10-2c-19-3-36 1-47 9a37 37 0 0 0-15 32s4 32 45 39c35 7 51-2 60-10 13-11 12-31 7-41s-18-19-34-25v-1c16 6 30 16 35 26a36 36 0 0 1 3 25c-2 7-6 13-10 17-7 6-19 13-39 13Z"
          fill="#2f1d4a"
        />
        <path
          d="M89 90a98 98 0 0 1-11-1c-6-1-23-5-33-17-8-8-10-21-9-26 1-6 5-12 11-17 8-6 19-9 32-9 31 0 49 17 52 23 5 7 10 21-3 35-9 10-27 12-39 12ZM79 21c-14 0-39 5-42 25-1 5 1 18 9 26 10 11 26 15 32 16 0 0 35 5 49-11 13-13 8-26 4-33-4-6-21-23-52-23Z"
          fill="#2f1d4a"
        />
        <path
          d="M85 58a10 10 0 0 1-2 0 7 7 0 0 1-4-3 4 4 0 0 1-1-3c1-2 5-3 8-2 5 1 4 5 4 5a3 3 0 0 1-1 2 7 7 0 0 1-4 1Zm-1-8-5 2a3 3 0 0 0 1 3 6 6 0 0 0 3 2 7 7 0 0 0 5 0 2 2 0 0 0 1-2c0-1 1-3-3-4a7 7 0 0 0-2-1Zm-5 2Z"
          fill="#2f1d4a"
        />
        <path
          d="m89 53-3-16-6 15a1 1 0 0 1-1-1l7-16h1l3 18a1 1 0 0 1-1 0Zm26 29-23-8 20-10a1 1 0 0 1 1 1l3 16-1 1Zm-21-8 20 7-2-15ZM60 50l-1-15v-1a1 1 0 0 1 1 0l20 7h1l-1 1-19 8h-1Zm0-15 1 14 18-8Z"
          fill="#2f1d4a"
        />
        <path
          d="M133 71h-1v-1c1-4 2-9-4-18s-18-17-31-21c-21-5-39 0-48 6-6 5-9 10-10 14a1 1 0 0 1-1 0c1-4 4-10 11-15 9-6 27-11 48-6 14 4 26 12 32 22 6 9 5 14 4 19Zm10 3a1 1 0 0 1-1 0l1-14a1 1 0 1 1 1 0l-1 14Zm-1 11v-4a1 1 0 0 1 1 0v4h-1Z"
          fill="#2f1d4a"
        />
        <path
          d="M91 121c-17 0-35-4-51-14-12-9-16-19-18-26a33 33 0 0 1-1-13l7-28h1l-7 28s-4 22 19 38c21 15 49 16 67 13 16-3 32-12 33-26v-4a1 1 0 0 1 1-1 1 1 0 0 1 0 1v4c-1 15-18 24-33 27a99 99 0 0 1-18 1Z"
          fill="#2f1d4a"
        />
        <path
          d="M93 103h-4c-21-1-38-7-51-19a40 40 0 0 1-13-29 1 1 0 0 1 1 0 39 39 0 0 0 13 28c12 12 29 18 50 19 23 1 49-9 53-28a1 1 0 0 1 1-1 1 1 0 0 1 0 1c-2 9-8 16-19 22-9 4-20 7-31 7Z"
          fill="#2f1d4a"
        />
        <path
          d="M45 59a1 1 0 0 1 0-1h6a1 1 0 0 1 1 0 1 1 0 0 1-1 1h-6Zm7-13-5-2a1 1 0 0 1 1-1l5 2a1 1 0 0 1-1 1Zm30-10a1 1 0 0 1-1 0v-4a1 1 0 0 1 1 0v4Zm15 3h-1a1 1 0 0 1 0-1l3-3a1 1 0 0 1 0 1l-2 3Zm21 17a1 1 0 0 1 0-1l6-1a1 1 0 0 1 0 1l-6 1Zm8 11-6-2a1 1 0 0 1-1-1 1 1 0 0 1 1 0l6 2v1ZM97 84a1 1 0 0 1-1 0l-2-4a1 1 0 0 1 0-1h1l2 4a1 1 0 0 1 0 1Zm-26-3a1 1 0 0 1-1-1l3-4a1 1 0 0 1 1 1l-3 3a1 1 0 0 1 0 1Zm-10-4-6-1a1 1 0 0 1-1 0l-5-4 1-6a1 1 0 0 1 1 0l6-3 6 1 1 1 4 3a1 1 0 0 1 0 1l-1 5h-1l-5 3Zm-6-2 6 1 5-3 1-4-4-4-6-1-6 3-1 5Zm50-23h-1l-5-4a1 1 0 0 1 0-1l1-4 6-3 6 1 5 3v5l-5 3a1 1 0 0 1-1 0h-6Zm-5-5 5 4h6l5-3v-3l-4-3-6-1-5 3Z"
          fill="#2f1d4a"
        />
        <path fill="#2f1d4a" d="m54 71 1 1 4-2-1-1-4 2z" />
        <ellipse cx="61.4" cy="68.2" rx="1.4" ry="1" fill="#2f1d4a" />
        <ellipse cx="105.1" cy="47.1" rx="1.4" ry="1" fill="#2f1d4a" />
        <path fill="#2f1d4a" d="m107 45 5-2 2 1-5 2-2-1zm-41-4-4-3h2l3 3h-1z" />
        <ellipse cx="68.1" cy="42.6" rx="1.4" ry="1" fill="#2f1d4a" />
        <path fill="#2f1d4a" d="m107 74 3 4 2-1-4-4-1 1z" />
        <ellipse cx="105.2" cy="71.4" rx="1.4" ry="1" fill="#2f1d4a" />
        <path d="M83 58a6 6 0 0 1-4-3l2 24 8-22-6 1Z" fill="#2f1d4a" />
        <path
          d="m81 79-2-24a1 1 0 0 1 1 0 6 6 0 0 0 3 2c3 1 5 0 6-1a1 1 0 0 1 1 1l-8 22a1 1 0 0 1-1 0Zm-1-22 2 19 6-18a8 8 0 0 1-5 0 7 7 0 0 1-3-1Z"
          fill="#2f1d4a"
        />
      </Compass>
      <Log
        xmlns="http://www.w3.org/2000/svg"
        width="225"
        viewBox="0 0 243.3 103.5"
        variants={{
          initial: {
            opacity: 0,
            scale: 0.9,
          },
          animate: {
            opacity: 1,
            scale: 1,
            transition: testableTransition({duration: 0.5}),
          },
          exit: {y: -200, opacity: 0},
        }}
        transition={testableTransition({
          duration: 1.1,
        })}
      >
        <path
          d="M13 51s-3 6-2 20a45 45 0 0 0 7 24l14 8h154s15-7 15-36a54 54 0 0 0-2-13c-4-19-16-24-16-24h-7a16 16 0 0 0 1-12l-5-4a17 17 0 0 0-8 1l-15 14-116 1s-12 5-20 21Z"
          fill="#fff"
        />
        <path fill="#ebb432" d="m81 19 16 4-4-18-12 14z" />
        <path fill="#e1557a" d="m121 1-4 16 17-2-13-14z" />
        <path fill="#f58452" d="m54 20 3-15 14 8-17 7z" />
        <path
          d="m52 32 96 1-9 24a2 2 0 0 1-3 0l-4-5-8 17a2 2 0 0 1-4 0l-9-27-10 19a2 2 0 0 1-4 0L85 40 69 55a2 2 0 0 1-3-1c-2-6-5-18-14-22Zm121 12 8 16 7-14 6 7 4-9s-4-8-9-11h-12Z"
          fill="#b29dd2"
          opacity=".5"
        />
        <path
          d="M243 104H0a1 1 0 0 1 0-1h243a1 1 0 0 1 1 0 1 1 0 0 1-1 1Z"
          fill="#2f1d4a"
        />
        <path
          d="M16 104a1 1 0 0 1-1-1 61 61 0 0 0-3-7 29 29 0 0 0-1 5 1 1 0 0 1-1 0l-5-9a48 48 0 0 0 3 9 1 1 0 0 1 0 1H7a74 74 0 0 0-6-6 76 76 0 0 0 5 7 1 1 0 0 1-1 0l-5-8a1 1 0 0 1 0-1l6 5c-2-7-1-8-1-8l5 8 2-4 4 8a1 1 0 0 1 0 1Zm-4-8Zm38 8a1 1 0 0 1 0-1c5-2 10-8 11-11s4-18 3-24-2-23-9-30-22-8-22-8c-2 0-19 13-21 26-2 10-1 19 1 27l5 10 11 7a1 1 0 0 1 0 1c-1 0-10-5-11-7-1-1-11-14-7-38 2-13 19-27 22-27 0 0 15 1 23 8s9 25 10 31-3 22-4 25c-2 2-6 9-12 11Z"
          fill="#2f1d4a"
        />
        <path
          d="m45 100-14-1-12-8c-2-2-6-21-6-30 0-10 13-27 22-27s18 6 20 8 6 16 6 20v21c-1 6-6 14-10 16a1 1 0 0 1 0-1c4-2 8-10 9-15V62c0-4-5-18-6-20-1-1-11-7-19-7S14 52 14 61s4 27 6 29l11 8 16 1a1 1 0 0 1 0 1h-2Z"
          fill="#2f1d4a"
        />
        <path
          d="M55 60a1 1 0 0 1 0-1s-2-11-8-16c-6-4-13-1-13-1a1 1 0 0 1 0-1s7-4 13 1c7 5 8 16 9 17a1 1 0 0 1-1 1ZM41 93a17 17 0 0 1-4-1c-6-1-15-9-16-14s-3-13 0-21 9-13 9-14a1 1 0 0 1 1 0v1s-7 6-9 13-1 17 0 21 9 12 15 13h9a4 4 0 0 0 2 0l7-7a52 52 0 0 0 0-5 1 1 0 0 1 1-1 1 1 0 0 1 0 1 52 52 0 0 1 0 5c-1 3-5 6-7 7a5 5 0 0 1-3 1l-5 1Z"
          fill="#2f1d4a"
        />
        <path
          d="M39 85a5 5 0 0 1-1 0c-4-1-10-8-11-13s3-16 5-19c1-2 5-5 8-5 2 0 6 3 7 7 0 0 4 18 0 27-1 0-5 3-8 3Zm0-36-7 4c-1 4-5 15-4 19 1 5 7 11 10 12s7-2 8-3c4-9 0-26 0-26-1-4-5-6-7-6Zm7 32Z"
          fill="#2f1d4a"
        />
        <path
          d="M40 72a4 4 0 0 1-2-1 1 1 0 0 1 1 0 3 3 0 0 0 2 0l1-6c0-2-2-4-3-4a5 5 0 0 0-2 2 19 19 0 0 0 0 5 1 1 0 1 1-1 0v-5a6 6 0 0 1 2-3 2 2 0 0 1 2 0l3 5c0 3 0 7-2 7a3 3 0 0 1-1 0Zm32-3H61a1 1 0 0 1 0-1h11a1 1 0 0 1 1 0 1 1 0 0 1-1 1Zm7 10h-4a1 1 0 0 1 0-1h4a1 1 0 0 1 1 0 1 1 0 0 1-1 1Zm14 5h-8a1 1 0 1 1 0-1h8l9-2a1 1 0 0 1 0 1ZM82 96l-9-1h-1a1 1 0 0 1 1-1l9 1h1a1 1 0 0 1-1 1Zm58 1-15-1-6-3-12 4a1 1 0 0 1-1-1l13-4 6 3 15 1a1 1 0 0 1 0 1Zm43-21h-8a1 1 0 0 1 0-1h8a1 1 0 0 1 0 1Zm-37 0h-17a1 1 0 0 1 0-1h17l12-3 8 3h5a1 1 0 0 1 0 1h-5l-8-3-12 3Zm10 9h-16a1 1 0 0 1-1-1 1 1 0 0 1 1 0h16a1 1 0 1 1 0 1Zm19 8v-1l12-1a1 1 0 0 1 0 1l-12 1Zm7-63h-6a1 1 0 0 1 0-1h6a1 1 0 0 1 0 1Zm-37 0H33a1 1 0 0 1 0-1h112a1 1 0 0 1 0 1Z"
          fill="#2f1d4a"
        />
        <path
          d="M168 51h-1a1 1 0 0 1 0-1l10-23c2-4 1-7 0-8a8 8 0 0 0-6-4 13 13 0 0 0-7 0l-21 21a1 1 0 0 1-1 0v-1l22-21a13 13 0 0 1 7 0 9 9 0 0 1 7 4c1 2 2 5 0 10l-10 23Z"
          fill="#2f1d4a"
        />
        <path
          d="M172 30a10 10 0 0 1-2 0c-2 0-5-2-7-6-1-4 1-9 1-9a1 1 0 1 1 1 0s-2 5-1 9c2 4 4 5 6 5s6 1 8-4v-1a1 1 0 0 1 1 1 6 6 0 0 1-7 5Z"
          fill="#2f1d4a"
        />
        <path
          d="M169 27s-4-2-4-7a4 4 0 0 1 3-3 7 7 0 0 1 5 0c2 2 3 5 1 8a1 1 0 0 1 0-1c1-2 0-4-2-6a6 6 0 0 0-4 0 3 3 0 0 0-2 2 5 5 0 0 0 4 6l-1 1Z"
          fill="#2f1d4a"
        />
        <path
          d="M171 24a2 2 0 0 1-3-2 2 2 0 0 1 1-2 2 2 0 0 1 1 0 1 1 0 0 1 0 1 1 1 0 0 0-1 1 1 1 0 0 0 2 1 1 1 0 0 1 0 1Zm15 80v-1s8-6 11-13a63 63 0 0 0 3-23 74 74 0 0 0-5-23c-3-8-11-13-12-13a1 1 0 0 1 0-1 1 1 0 0 1 1 0s9 6 12 14a75 75 0 0 1 5 23 65 65 0 0 1-3 23c-3 8-11 13-11 13l-1 1Z"
          fill="#2f1d4a"
        />
        <path
          d="M200 60h-6a1 1 0 0 1 0-1h6a1 1 0 0 1 1 0 1 1 0 0 1-1 1Zm-2 27h-8a1 1 0 0 1 0-1h8a1 1 0 0 1 1 1 1 1 0 0 1-1 0Zm-20-29a2 2 0 0 1-1 0l-6-11a1 1 0 1 1 1 0l6 10a1 1 0 0 0 1 0l6-12h1l5 7 4-9h1l-4 9a1 1 0 0 1-1 1 1 1 0 0 1-1-1l-5-6-5 12a2 2 0 0 1-2 0Zm-59 13a2 2 0 0 1-2-1l-9-28-11 19a2 2 0 0 1-1 1 2 2 0 0 1-1-1L82 40h-1L67 54a1 1 0 1 1-1-1l14-14a2 2 0 0 1 3 0l12 21a1 1 0 0 0 1 1 1 1 0 0 0 1-1l10-18a1 1 0 0 1 1-1 1 1 0 0 1 1 1l9 28a1 1 0 0 0 2 0l11-21a1 1 0 0 1 0-1l5 7v-1l6-16h1l-6 17a1 1 0 0 1-2 0l-4-5-11 20a2 2 0 0 1-1 1Zm33-29v-1l6-7a1 1 0 1 1 1 1l-6 7a1 1 0 0 1-1 0Zm5 4h-1v-1l2-3a1 1 0 0 1 1 0 1 1 0 0 1 0 1l-2 3Zm-92-4a2 2 0 0 1 0-1 4 4 0 0 1-3-2 3 3 0 0 1 1-3 2 2 0 0 1 3 0 3 3 0 0 1 1 3 3 3 0 0 1-1 2 1 1 0 0 1-1 1Zm-2-3a3 3 0 0 0 2 2 2 2 0 0 0 1-2 2 2 0 0 0-1-2 1 1 0 0 0-1 0 2 2 0 0 0-1 2Zm8 5a2 2 0 0 1-1 0l-2-2a1 1 0 0 1 1-1 3 3 0 0 1 2 0c1 0 2 1 1 2a2 2 0 0 1-1 1Zm-1-2a1 1 0 0 0-1 0l2 1h1l-1-1a4 4 0 0 0-1 0Zm30-6-3-1a1 1 0 0 1 0-1l4-2a6 6 0 0 1 3 1 1 1 0 0 1 1 1l-3 2a7 7 0 0 1-2 0Zm-2-1h3a4 4 0 0 0 3-1 5 5 0 0 0-3-1l-3 1v1Z"
          fill="#2f1d4a"
        />
        <path
          d="M120 50a3 3 0 0 1-2-1 2 2 0 0 1 0-2 2 2 0 0 1 2-1 1 1 0 0 1 0 1 1 1 0 0 0-2 0 1 1 0 0 0 0 1 2 2 0 0 0 2 1 1 1 0 0 0 1 0 1 1 0 0 0 0-1 1 1 0 0 1 1 0 2 2 0 0 1-1 1 2 2 0 0 1-1 1Zm15-11 1 2 1-2h-2Zm1-2a2 2 0 0 1-1-1 1 1 0 0 1 0-1h1l1 1a1 1 0 0 0 1-1 1 1 0 0 0-1-1l-1 1a1 1 0 0 1-1 0v-1a2 2 0 0 1 3-1 2 2 0 0 1 1 2 2 2 0 0 1-2 2 3 3 0 0 1-1 0Zm82 67a1 1 0 0 1-1-1 44 44 0 0 0 5-6 46 46 0 0 0-7 4 1 1 0 0 1 0-1 21 21 0 0 0 2-5 41 41 0 0 0-6 6 1 1 0 0 1-1-1l3-9-6 9a1 1 0 0 1-1 0 45 45 0 0 0-1-8 37 37 0 0 0-1 8 1 1 0 0 1-1 0l1-9a1 1 0 0 1 1 0l2 7 6-8a1 1 0 0 1 1 0l-2 8 6-4a1 1 0 0 1 0 1l-1 4 6-3a1 1 0 0 1 1 1l-6 6v1ZM67 30a1 1 0 0 1-1 0s-1-9-6-14a1 1 0 1 1 1-1c5 6 6 14 6 15Z"
          fill="#2f1d4a"
        />
        <path
          d="M52 19a1 1 0 0 1 0-1l2-13a1 1 0 0 1 1 0l13 7 1 1a1 1 0 0 1-1 0l-16 6Zm3-13-2 12 14-5Zm40 15-15-4a1 1 0 0 1-1 0L91 4a1 1 0 0 1 1 0l4 17h-1Zm-14-4 14 3-4-15Zm34-1v-1l3-15h1l13 13a1 1 0 0 1 0 1l-17 2Zm4-14-3 13 15-2Z"
          fill="#2f1d4a"
        />
        <path
          d="M125 30a75 75 0 0 0-2-15 1 1 0 0 1 0-1l1 1a76 76 0 0 1 2 15h-1Zm-40 0a1 1 0 0 1-1 0 59 59 0 0 1 2-12 1 1 0 0 1 1 0v1a60 60 0 0 0-2 11ZM58 11l-2-3h1l2 3h-1z"
          fill="#2f1d4a"
        />
        <ellipse cx="59.2" cy="12.8" rx="1" ry=".8" fill="#2f1d4a" />
        <path fill="#2f1d4a" d="m88 13 1-4h2l-2 5-1-1z" />
        <ellipse
          cx="87.8"
          cy="15.6"
          rx="1.2"
          ry="1.1"
          transform="rotate(-8 88 16)"
          fill="#2f1d4a"
        />
        <path fill="#2f1d4a" d="m122 9-2-4h1l1 4z" />
        <ellipse
          cx="122.9"
          cy="11.4"
          rx="1"
          ry="1.2"
          transform="rotate(-71 123 11)"
          fill="#2f1d4a"
        />
      </Log>
    </Container>
  );
}

export default WelcomeBackground;

const Illustration = styled(motion.svg)`
  position: absolute;
  /* Important is needed to override our root SVG rule.
   * We disable clipping to allow some of the background
   * to animate outside of the illustration during transitions */
  overflow: visible !important;
`;

const Compass = styled(Illustration)`
  left: 24px;
  top: 32px;
`;

const Log = styled(Illustration)`
  right: -60px;
  bottom: 0;
`;

const Container = styled(motion.div)`
  pointer-events: none;
  position: absolute;
  height: 150%;
  max-width: 100vw;
  width: 300%;
  top: -25%;

  @media (max-width: ${p => p.theme.breakpoints.small}) {
    display: none;
  }
`;
