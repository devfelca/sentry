import FormField from 'sentry/components/deprecatedforms/formField';

type InputFieldProps = FormField['props'] & {
  autoComplete?: string;
  inputStyle?: Record<PropertyKey, unknown>;
  min?: number;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyPress?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  step?: number;
};

// XXX: This is ONLY used in GenericField. If we can delete that this can go.

/**
 * @deprecated Do not use this
 */
abstract class InputField<
  Props extends InputFieldProps = InputFieldProps,
  State extends FormField['state'] = FormField['state'],
> extends FormField<Props, State> {
  getField() {
    return (
      <input
        id={this.getId()} // TODO(Priscila): check the reason behind this. We are getting warnings if we have 2 or more fields with the same name, for instance in the DATA PRIVACY RULES
        type={this.getType()}
        className="form-control"
        autoComplete={this.props.autoComplete}
        placeholder={this.props.placeholder}
        onChange={this.onChange}
        disabled={this.props.disabled}
        name={this.props.name}
        required={this.props.required}
        value={this.state.value as string | number} // can't pass in boolean here
        style={this.props.inputStyle}
        onBlur={this.props.onBlur}
        onFocus={this.props.onFocus}
        onKeyPress={this.props.onKeyPress}
        onKeyDown={this.props.onKeyDown}
        min={this.props.min}
        step={this.props.step}
      />
    );
  }

  getClassName() {
    return 'control-group';
  }

  abstract getType(): string;
}

export default InputField;
