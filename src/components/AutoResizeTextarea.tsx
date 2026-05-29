import * as React from "react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface AutoResizeTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const AutoResizeTextarea = React.forwardRef<HTMLTextAreaElement, AutoResizeTextareaProps>(
  ({ className, ...props }, forwardedRef) => {
    const internalRef = useRef<HTMLTextAreaElement>(null);

    const setRef = (el: HTMLTextAreaElement | null) => {
      internalRef.current = el;
      if (typeof forwardedRef === "function") {
        forwardedRef(el);
      } else if (forwardedRef) {
        forwardedRef.current = el;
      }
    };

    useEffect(() => {
      const textarea = internalRef.current;
      if (!textarea) return;
      textarea.style.height = "auto";
      textarea.style.height = textarea.scrollHeight + "px";
    }, [props.value]);

    return (
      <textarea
        className={cn(
          "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none overflow-hidden",
          className,
        )}
        ref={setRef}
        {...props}
        onInput={(e) => {
          const target = e.currentTarget;
          target.style.height = "auto";
          target.style.height = target.scrollHeight + "px";
          props.onInput?.(e);
        }}
      />
    );
  },
);
AutoResizeTextarea.displayName = "AutoResizeTextarea";

export { AutoResizeTextarea };
