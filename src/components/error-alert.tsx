import { AlertCircle } from "lucide-react"

type ErrorAlertProps = {
  message: string
  className?: string
}

export function ErrorAlert({ message, className = "" }: ErrorAlertProps) {
  return (
    <div
      role="alert"
      className={`flex gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 ${className}`}
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </div>
  )
}
