import { Copy, Eye, EyeSlash } from "@phosphor-icons/react";
import { Toast } from "@base-ui/react/toast";
import { Tooltip as TooltipBase } from "@base-ui/react/tooltip";
import {
  forwardRef,
  useCallback,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import { cn } from "../../utils/cn";
import {
  KUMO_INPUT_VARIANTS,
  type KumoInputSize,
  type KumoInputVariant,
} from "../input/input";
import { InputGroup } from "../input-group/input-group";
import type { FieldErrorMatch } from "../field/field";

export const KUMO_SENSITIVE_INPUT_VARIANTS = KUMO_INPUT_VARIANTS;

export const KUMO_SENSITIVE_INPUT_DEFAULT_VARIANTS = {
  size: "base",
  variant: "default",
} as const;

/**
 * SensitiveInput component props.
 *
 * @example
 * ```tsx
 * <SensitiveInput label="API Key" defaultValue="sk_live_abc123xyz789" />
 * <SensitiveInput label="Secret" value={secret} onValueChange={setSecret} />
 * ```
 */
/** Accessible labels for i18n. Pass translated strings to override English defaults. */
export interface SensitiveInputLabels {
  /** Aria label for the copy button. @default "Copy to clipboard" */
  copyAction?: string;
  /** Tooltip text for the copy button. @default "Copy" */
  copyTooltip?: string;
  /** Toast title shown after copying. @default "Copied!" */
  copiedToast?: string;
  /** Aria label for the reveal button when value is hidden. @default "Reveal value" */
  reveal?: string;
  /** Tooltip text for the reveal button. @default "Reveal" */
  revealTooltip?: string;
  /** Aria label for the hide button when value is visible. @default "Hide value" */
  hide?: string;
  /** Tooltip text for the hide button. @default "Hide" */
  hideTooltip?: string;
}

const DEFAULT_LABELS: Required<SensitiveInputLabels> = {
  copyAction: "Copy to clipboard",
  copyTooltip: "Copy",
  copiedToast: "Copied!",
  reveal: "Reveal value",
  revealTooltip: "Reveal",
  hide: "Hide value",
  hideTooltip: "Hide",
};

export interface SensitiveInputProps
  extends Omit<
    ComponentPropsWithoutRef<"input">,
    "size" | "type" | "value" | "defaultValue"
  > {
  /** Controlled value */
  value?: string;
  /** Uncontrolled default value */
  defaultValue?: string;
  /** Simplified change handler receiving just the value */
  onValueChange?: (value: string) => void;
  /**
   * Callback fired after value is copied to clipboard.
   * When provided, a copy button is rendered alongside the reveal toggle.
   */
  onCopy?: () => void;
  /**
   * Size of the input.
   * @default "base"
   */
  size?: KumoInputSize;
  /**
   * Style variant of the input.
   * @default "default"
   */
  variant?: KumoInputVariant;
  /** Label content for the input */
  label?: ReactNode;
  /** Tooltip content to display next to the label */
  labelTooltip?: ReactNode;
  /** Helper text displayed below the input */
  description?: ReactNode;
  /** Error message or validation error object */
  error?: string | { message: ReactNode; match: FieldErrorMatch };
  /** Accessible labels for i18n. Pass translated strings to override English defaults. */
  labels?: SensitiveInputLabels;
}

/**
 * Password/secret input that masks its value by default and reveals on toggle.
 * Built on InputGroup for consistent sizing and layout.
 *
 * Pass `onCopy` to enable a copy-to-clipboard button with an anchored
 * toast confirmation.
 *
 * @example
 * ```tsx
 * // Basic — reveal/mask only
 * <SensitiveInput label="API Key" defaultValue="sk_live_abc123xyz789" />
 *
 * // With copy button
 * <SensitiveInput label="API Key" defaultValue="sk_live_abc123xyz789" onCopy={() => {}} />
 * ```
 */
export const SensitiveInput = forwardRef<HTMLInputElement, SensitiveInputProps>(
  (
    {
      value: controlledValue,
      defaultValue = "",
      onChange,
      onBlur,
      onValueChange,
      onCopy,
      size = KUMO_SENSITIVE_INPUT_DEFAULT_VARIANTS.size,
      variant: _variant = KUMO_SENSITIVE_INPUT_DEFAULT_VARIANTS.variant,
      disabled = false,
      readOnly = false,
      autoComplete = "off",
      className,
      label,
      labelTooltip,
      description,
      error,
      required,
      labels: labelsProp,
      ...inputProps
    },
    ref,
  ) => {
    const labels = { ...DEFAULT_LABELS, ...labelsProp };
    const isControlled = controlledValue !== undefined;
    const [internalValue, setInternalValue] = useState(defaultValue);
    const value = isControlled ? controlledValue : internalValue;
    const hasValue = value.length > 0;

    const [revealed, setRevealed] = useState(false);

    const inputRef = useRef<HTMLInputElement | null>(null);
    const containerRef = useRef<HTMLElement>(null);
    const copyButtonRef = useRef<HTMLButtonElement>(null);

    const mergedRef = useCallback(
      (node: HTMLInputElement | null) => {
        inputRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      },
      [ref],
    );

    // Mask on blur (unless focus moves to a sibling button inside the group)
    const handleBlur = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        onBlur?.(e);
        if (
          containerRef.current &&
          e.relatedTarget instanceof Node &&
          containerRef.current.contains(e.relatedTarget)
        ) {
          return;
        }
        if (hasValue) setRevealed(false);
      },
      [hasValue, onBlur],
    );

    // Escape to re-mask
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (revealed && e.key === "Escape") {
          setRevealed(false);
        }
      },
      [revealed],
    );

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = e.target.value;
        if (!isControlled) setInternalValue(v);
        if (!revealed && v.length > 0) setRevealed(true);
        onChange?.(e);
        onValueChange?.(v);
      },
      [isControlled, onChange, onValueChange, revealed],
    );

    const toggleVisibility = useCallback(() => {
      setRevealed((r) => !r);
    }, []);

    // Sync: if value is cleared externally, unmask
    const prevHasValueRef = useRef(hasValue);
    if (prevHasValueRef.current !== hasValue) {
      prevHasValueRef.current = hasValue;
      if (!hasValue && !revealed) setRevealed(false);
    }

    const normalizedError = error
      ? typeof error === "string"
        ? { message: error, match: true as const }
        : error
      : undefined;

    return (
      <Toast.Provider timeout={1500}>
        <SensitiveInputInner
          containerRef={containerRef}
          inputRef={mergedRef}
          copyButtonRef={copyButtonRef}
          value={value}
          hasValue={hasValue}
          revealed={revealed}
          size={size}
          disabled={disabled}
          readOnly={readOnly}
          autoComplete={autoComplete}
          className={className}
          label={label}
          labelTooltip={labelTooltip}
          description={description}
          error={normalizedError}
          required={required}
          handleBlur={handleBlur}
          handleKeyDown={handleKeyDown}
          handleChange={handleChange}
          toggleVisibility={toggleVisibility}
          onCopy={onCopy}
          labels={labels}
          inputProps={inputProps}
        />
      </Toast.Provider>
    );
  },
);

SensitiveInput.displayName = "SensitiveInput";

/**
 * Inner component that renders inside Toast.Provider so it can use
 * the useToastManager hook.
 */
function SensitiveInputInner({
  containerRef,
  inputRef,
  copyButtonRef,
  value,
  hasValue,
  revealed,
  size,
  disabled,
  readOnly,
  autoComplete,
  className,
  label,
  labelTooltip,
  description,
  error,
  required,
  handleBlur,
  handleKeyDown,
  handleChange,
  toggleVisibility,
  onCopy,
  labels,
  inputProps,
}: {
  containerRef: React.RefObject<HTMLElement | null>;
  inputRef: (node: HTMLInputElement | null) => void;
  copyButtonRef: React.RefObject<HTMLButtonElement | null>;
  value: string;
  hasValue: boolean;
  revealed: boolean;
  size: KumoInputSize;
  disabled: boolean;
  readOnly: boolean;
  autoComplete: string;
  className?: string;
  label?: ReactNode;
  labelTooltip?: ReactNode;
  description?: ReactNode;
  error?: { message: ReactNode; match: FieldErrorMatch };
  required?: boolean;
  handleBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  toggleVisibility: () => void;
  onCopy?: () => void;
  labels: Required<SensitiveInputLabels>;
  inputProps: Record<string, unknown>;
}) {
  const toastManager = Toast.useToastManager();

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      toastManager.add({
        id: "sensitive-input-copied",
        title: labels.copiedToast,
        timeout: 1500,
        positionerProps: {
          anchor: copyButtonRef.current,
          side: "top",
          sideOffset: 10,
          align: "center",
        },
      });
      onCopy?.();
    } catch {
      console.warn("Clipboard copy failed");
    }
  }, [value, onCopy, toastManager, copyButtonRef, labels.copiedToast]);

  return (
    <>
      <InputGroup
        ref={containerRef}
        size={size}
        disabled={disabled}
        label={label}
        labelTooltip={labelTooltip}
        description={description}
        error={error}
        required={required}
        className={className}
      >
        <InputGroup.Input
          ref={inputRef}
          type={revealed ? "text" : "password"}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          readOnly={readOnly}
          autoComplete={autoComplete}
          {...inputProps}
        />
        <InputGroup.Addon align="end">
          {onCopy && hasValue && !disabled && (
            <InvertedTooltip content={labels.copyTooltip}>
              <InputGroup.Button
                ref={copyButtonRef}
                icon={Copy}
                aria-label={labels.copyAction}
                onClick={copyToClipboard}
                onBlur={() => toastManager.close("sensitive-input-copied")}
              />
            </InvertedTooltip>
          )}
          {!disabled && (
            <InvertedTooltip content={revealed ? labels.hideTooltip : labels.revealTooltip}>
              <InputGroup.Button
                icon={revealed ? EyeSlash : Eye}
                aria-label={revealed ? labels.hide : labels.reveal}
                onClick={toggleVisibility}
              />
            </InvertedTooltip>
          )}
        </InputGroup.Addon>
      </InputGroup>

      {/* Anchored toast viewport — renders "Copied!" near the copy button */}
      <Toast.Portal>
        <Toast.Viewport className="pointer-events-none fixed z-50">
          <AnchoredToastList />
        </Toast.Viewport>
      </Toast.Portal>
    </>
  );
}

const INVERTED_POPUP_CLASS = cn(
          "origin-[var(--transform-origin)] rounded-md bg-kumo-contrast px-2.5 py-1.5 text-sm font-medium text-kumo-inverse",
  "shadow-lg",
  "transition-[transform,opacity] duration-150",
  "data-[starting-style]:scale-90 data-[starting-style]:opacity-0",
  "data-[ending-style]:scale-90 data-[ending-style]:opacity-0",
  "data-[instant]:duration-0",
);

/** Dark inverted tooltip used for SensitiveInput action buttons. */
function InvertedTooltip({
  content,
  children,
}: {
  content: ReactNode;
  children: ReactNode;
}) {
  return (
    <TooltipBase.Root>
      <TooltipBase.Trigger
        className="inline-flex items-center bg-transparent border-none shadow-none p-0 m-0 h-auto min-h-0 leading-[0] cursor-default"
        render={children as React.ReactElement}
      />
      <TooltipBase.Portal>
        <TooltipBase.Positioner side="top" sideOffset={10}>
          <TooltipBase.Popup className={INVERTED_POPUP_CLASS}>
            <TooltipBase.Arrow className="fill-kumo-contrast" />
            {content}
          </TooltipBase.Popup>
        </TooltipBase.Positioner>
      </TooltipBase.Portal>
    </TooltipBase.Root>
  );
}

function AnchoredToastList() {
  const { toasts } = Toast.useToastManager();
  return toasts.map((toast) => (
    <Toast.Positioner key={toast.id} toast={toast}>
      <Toast.Root
        toast={toast}
        className={cn(
  "origin-[var(--transform-origin)] rounded-md bg-kumo-contrast px-2.5 py-1.5 text-sm font-medium text-kumo-inverse",
          "shadow-lg",
          "transition-[transform,opacity] duration-150",
          "data-[starting-style]:scale-90 data-[starting-style]:opacity-0",
          "data-[ending-style]:scale-90 data-[ending-style]:opacity-0",
        )}
      >
        <Toast.Arrow className="fill-kumo-contrast" />
        <Toast.Title />
      </Toast.Root>
    </Toast.Positioner>
  ));
}
