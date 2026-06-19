import { ScrollablePanel } from "@/components/shared/scrollable-panel";
import { typography } from "@/lib/typography";

interface InstructionsListProps {
  instructions: string[];
}

export function InstructionsList({ instructions }: InstructionsListProps) {
  if (!instructions.length) {
    return null;
  }

  return (
    <ScrollablePanel>
      <ol className={`space-y-2 p-3 sm:p-4 ${typography.bodySmall}`}>
        {instructions.map((instruction, index) => (
          <li key={`${index}-${instruction}`} className="flex gap-3">
            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white sm:size-8">
              {index + 1}
            </span>
            <span className="min-w-0 leading-relaxed">{instruction}</span>
          </li>
        ))}
      </ol>
    </ScrollablePanel>
  );
}
