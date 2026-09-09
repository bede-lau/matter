"use client";
// Adapted from ReUI c-dropdown-menu-1 and c-tabs-6 (MIT); see docs/licenses/ReUI-MIT.md.
import type { ReactNode } from "react";
import {
  Download,
  ChevronDown,
  FileJson,
  Database,
  BookOpen,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function ExportMenu({
  experiment,
  dataset,
  guide,
}: {
  experiment: () => void;
  dataset: () => void;
  guide: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="outline-button export-trigger">
          <Download size={16} /> Export <ChevronDown size={15} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="matter-menu" align="end" sideOffset={8}>
        <DropdownMenuGroup>
          <DropdownMenuLabel>Keep your work</DropdownMenuLabel>
          <DropdownMenuItem onSelect={experiment}>
            <FileJson /> Export experiment <span>JSON</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={dataset}>
            <Database /> Export imported records <span>JSON</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={guide}>
            <BookOpen /> Open field guide
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
export function Choice({
  label,
  id,
  value,
  options,
  onChange,
}: {
  label: string;
  id?: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} aria-label={label} className="matter-select">
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" className="matter-menu">
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
export function ModeTabs({
  value,
  onChange,
  items,
  label,
  panelId,
}: {
  value: string;
  onChange: (v: string) => void;
  items: { value: string; label: string; icon: ReactNode }[];
  label: string;
  panelId: string;
}) {
  return (
    <Tabs value={value} onValueChange={onChange} className="reui-tabs">
      <TabsList aria-label={label} className="w-full">
        {items.map((item) => (
          <TabsTrigger
            key={item.value}
            value={item.value}
            id={`${panelId}-${item.value}`}
            aria-controls={panelId}
          >
            {item.icon}
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
