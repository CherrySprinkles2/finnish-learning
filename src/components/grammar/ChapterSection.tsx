import type {
  ExampleContent,
  ExerciseContent,
  GradationContent,
  GrammarBlock,
  GrammarChapter,
  TableContent,
} from '../../data/grammar'
import ProseBlock from './ProseBlock'
import RuleBlock from './RuleBlock'
import GrammarTable from './GrammarTable'
import ExampleBlock from './ExampleBlock'
import GradationTable from './GradationTable'
import ExerciseBlock from './ExerciseBlock'

function BlockRenderer({ block }: { block: GrammarBlock }) {
  switch (block.type) {
    case 'prose':
      return <ProseBlock title={block.title} text={block.content as string} />
    case 'rule':
      return <RuleBlock title={block.title} text={block.content as string} />
    case 'table':
      return <GrammarTable title={block.title} content={block.content as TableContent} />
    case 'example':
      return <ExampleBlock content={block.content as ExampleContent} />
    case 'gradation':
      return <GradationTable title={block.title} content={block.content as GradationContent} />
    case 'exercise':
      return <ExerciseBlock content={block.content as ExerciseContent} />
    default:
      return null
  }
}

export default function ChapterSection({
  chapter,
  isOpen,
  onToggle,
}: {
  chapter: GrammarChapter
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <section id={`kappale-${chapter.number}`} className="scroll-mt-20">
      <div className="bg-surface rounded-lg shadow-sm border border-line-subtle overflow-hidden">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-base transition-colors"
        >
          <span>
            <span className="block text-lg font-display font-bold text-ink">
              Kappale {chapter.number} — {chapter.title}
            </span>
            <span className="block text-sm text-ink-faint italic">{chapter.subtitle}</span>
          </span>
          <span className={`text-ink-faint text-h4 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
            ⌄
          </span>
        </button>

        {isOpen && (
          <div className="px-6 pb-6 pt-2 space-y-8 border-t border-line-subtle">
            {chapter.sections.map((section, s) => (
              <div key={s}>
                <h3 className="text-body font-semibold text-accent mb-3">{section.topic}</h3>
                <div className="space-y-4">
                  {section.blocks.map((block, b) => (
                    <BlockRenderer key={b} block={block} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
