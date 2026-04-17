import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface CategoryItem {
  name: string;
  icons: string | null;
}

interface CategoryFilterProps {
  categories: CategoryItem[];
  selected: string;
  onSelect: (category: string) => void;
}

export default function CategoryFilter({
  categories,
  selected,
  onSelect,
}: CategoryFilterProps) {
  return (
    <ScrollArea className="w-full" data-testid="filter-categories">
      <div className="flex gap-2 p-4">
        <Button
          variant={!selected ? "default" : "outline"}
          size="sm"
          onClick={() => onSelect("")}
          data-testid="button-category-all"
        >
          전체
        </Button>
        {categories.map((category) => (
          <Button
            key={category.name}
            variant={selected === category.name ? "default" : "outline"}
            size="sm"
            onClick={() => onSelect(category.name)}
            data-testid={`button-category-${category}`}
          >
            {category.icons && <span>{category.icons}</span>}
            {category.name}
          </Button>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
