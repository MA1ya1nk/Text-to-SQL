import * as React from "react";
import { clsx } from "clsx";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ className, ...props }: Props) {
  return (
    <button
      className={clsx("inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50", className)}
      {...props}
    />
  );
}
