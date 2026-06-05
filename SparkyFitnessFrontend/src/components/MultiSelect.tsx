import React, { useState, useCallback, useMemo } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Item {
  value: string;
  label: string;
}

interface MultiSelectProps {
  items: Item[];
  selectedValues: string[];
  onValueChange: (values: string[]) => void;
  placeholder?: string;
  noResultsText?: string;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  items,
  selectedValues,
  onValueChange,
  placeholder = "Select items...",
  noResultsText = "No item found.",
}) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const handleSelect = useCallback(
    (itemValue: string) => {
      const newSelectedValues = selectedValues.includes(itemValue)
        ? selectedValues.filter((val) => val !== itemValue)
        : [...selectedValues, itemValue];
      onValueChange(newSelectedValues);
    },
    [selectedValues, onValueChange]
  );

  const filteredItems = useMemo(() => {
    if (!searchValue) return items;
    return items.filter((item) =>
      item.label.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [items, searchValue]);

  const selectedLabels = useMemo(() => {
    return selectedValues.map(
      (value) => items.find((item) => item.value === value)?.label
    ).filter(Boolean) as string[];
  }, [selectedValues, items]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-auto min-h-[36px] flex-wrap"
        >
          {selectedLabels.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {selectedLabels.map((label, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {label}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(items.find(item => item.label === label)?.value || "");
                    }}
                  />
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput
            placeholder="Search items..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandEmpty>{noResultsText}</CommandEmpty>
          <CommandGroup>
            {filteredItems.map((item) => (
              <CommandItem
                key={item.value}
                value={item.value}
                onSelect={() => {
                  handleSelect(item.value);
                  setSearchValue(""); // Clear search after selection
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedValues.includes(item.value) ? "opacity-100" : "opacity-0"
                  )}
                />
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default MultiSelect;