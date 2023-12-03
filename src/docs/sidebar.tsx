import { memo, useMemo } from "react";

import { OperatorInfo, useOperators } from "@/shared/config/docs";

export interface SideBarProps {
  search: string;
  className?: string;
}

interface Group {
  name: string;
  operators: OperatorInfo[];
}

export const SideBar = memo(({ search, className }: SideBarProps) => {
  const { data: operators } = useOperators();
  const groups = useMemo(() => {
    const groups: Record<string, Group> = {};
    const add = (groupName: string, operator: OperatorInfo) => {
      const group = groups[groupName];
      if (group) {
        group.operators.push(operator);
      } else {
        groups[groupName] = {
          name: groupName,
          operators: [operator],
        };
      }
    };
    for (const op of operators) {
      const parts = op.name.split(".");
      if (parts.length === 1) {
        add("Common", op);
      } else {
        add(parts[0], op);
      }
    }
    return Object.values(groups); //.sort((a, b) => a.name.localeCompare(b.name))
  }, [operators]);
  const matchedGroups = useMemo(() => {
    if (search.trim() === "") {
      return groups;
    }
    return groups
      .map((g) => ({
        name: g.name,
        operators: g.operators.filter((op) => op.name.includes(search)),
      }))
      .filter((g) => g.operators.length > 0);
  }, [groups, search]);
  return (
    <div className={className}>
      {matchedGroups.map((g) => (
        <div key={g.name} className="pb-4">
          <p className="font-bold text-2xl">{g.name}</p>
          <ul className="pl-4">
            {g.operators.map((op) => (
              <li key={op.name}>
                <a href={`#${op.slug}`}>{op.name}</a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
});
