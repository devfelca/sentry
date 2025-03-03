import {forwardRef, useImperativeHandle, useRef} from 'react';
import styled from '@emotion/styled';

import InteractionStateLayer from 'sentry/components/interactionStateLayer';
import type {FormSize} from 'sentry/utils/theme';

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'checked' | 'size'> {
  /**
   * Is the checkbox active? Supports 'indeterminate'
   */
  checked?: React.InputHTMLAttributes<HTMLInputElement>['checked'] | 'indeterminate';
  /**
   * The size of the checkbox. Defaults to 'sm'.
   */
  size?: FormSize;
}

type CheckboxConfig = {
  borderRadius: string;
  box: string;
  icon: string;
};

const checkboxSizeMap: Record<FormSize, CheckboxConfig> = {
  xs: {box: '12px', borderRadius: '2px', icon: '10px'},
  sm: {box: '16px', borderRadius: '4px', icon: '12px'},
  md: {box: '22px', borderRadius: '6px', icon: '18px'},
};

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({checked = false, size = 'sm', className, ...props}, ref) => {
    const nativeCheckboxRef = useRef<HTMLInputElement>(null);
    useImperativeHandle(ref, () => nativeCheckboxRef.current as HTMLInputElement);

    if (nativeCheckboxRef.current) {
      nativeCheckboxRef.current.indeterminate = checked === 'indeterminate';
    }

    const wrapperProps: React.HTMLAttributes<HTMLDivElement> = {
      className,
      style: props.style,
    };

    return (
      <CheckboxWrapper checked={checked} size={size} {...wrapperProps}>
        <NativeHiddenCheckbox
          ref={nativeCheckboxRef}
          checked={checked !== 'indeterminate' && checked}
          type="checkbox"
          aria-checked={checked === 'indeterminate' ? 'mixed' : checked}
          {...props}
        />

        <FakeCheckbox aria-hidden checked={checked} size={size}>
          {(checked === true || checked === 'indeterminate') && (
            <CheckboxIcon viewBox="0 0 16 16" size={checkboxSizeMap[size].icon}>
              {checked === 'indeterminate' ? (
                <path d="M3 8H13" />
              ) : (
                <path d="M2.86 9.14C4.42 10.7 6.9 13.14 6.86 13.14L12.57 3.43" />
              )}
            </CheckboxIcon>
          )}
        </FakeCheckbox>
        {!props.disabled && (
          <InteractionStateLayer
            higherOpacity={checked === true || checked === 'indeterminate'}
          />
        )}
      </CheckboxWrapper>
    );
  }
);

const CheckboxWrapper = styled('div')<{
  checked: CheckboxProps['checked'];
  size: FormSize;
}>`
  position: relative;
  cursor: pointer;
  display: inline-flex;
  justify-content: flex-start;
  color: ${p => (p.checked ? p.theme.white : p.theme.textColor)};
  border-radius: ${p => checkboxSizeMap[p.size].borderRadius};
`;

const NativeHiddenCheckbox = styled('input')`
  position: absolute;
  opacity: 0;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
  cursor: pointer;

  &:focus-visible + * {
    box-shadow: ${p =>
      p.checked ? `${p.theme.focus} 0 0 0 3px` : `${p.theme.focusBorder} 0 0 0 1px`};
    border-color: ${p => (p.checked ? p.theme.focusBorder : 'none')};
  }

  &:disabled + * {
    background: ${p => (p.checked ? p.theme.disabled : p.theme.backgroundSecondary)};
    border-color: ${p => (p.checked ? p.theme.disabledBorder : 'inherit')};
  }
`;

const FakeCheckbox = styled('div')<{
  checked: CheckboxProps['checked'];
  size: FormSize;
}>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  color: inherit;
  box-shadow: ${p => p.theme.dropShadowMedium} inset;
  width: ${p => checkboxSizeMap[p.size].box};
  height: ${p => checkboxSizeMap[p.size].box};
  border-radius: ${p => checkboxSizeMap[p.size].borderRadius};
  pointer-events: none;

  background: ${p => (p.checked ? p.color ?? p.theme.active : p.theme.background)};
  border: ${p => (p.checked ? 'none' : `1px solid ${p.theme.gray200}`)};
`;

const CheckboxIcon = styled('svg')<{size: string}>`
  width: ${p => p.size};
  height: ${p => p.size};

  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke: ${p => p.theme.white};
  stroke-width: calc(1.4px + ${p => p.size} * 0.04);
`;
