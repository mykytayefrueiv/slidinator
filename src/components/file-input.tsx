import { FileText } from "lucide-react"

type FileInputProps = {
  id: string
  label: string
  description: string
  file: File | null
  onChange: (file: File | null) => void
}

export function FileInput({
  id,
  label,
  description,
  file,
  onChange,
}: FileInputProps) {
  return (
    <label
      htmlFor={id}
      className="grid cursor-pointer gap-3 rounded-lg border border-slate-300 bg-slate-50 p-4 transition hover:border-emerald-500 hover:bg-emerald-50/40"
    >
      <span className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-white text-emerald-700 shadow-sm">
          <FileText className="size-5" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-slate-900">
            {label}
          </span>
          <span className="block text-xs leading-5 text-slate-600">
            {description}
          </span>
          <span className="mt-2 block truncate text-sm font-medium text-emerald-800">
            {file ? file.name : "Choose a PDF"}
          </span>
        </span>
      </span>
      <input
        id={id}
        name={id}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      />
    </label>
  )
}
