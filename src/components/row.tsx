export interface RowProps {
  children: React.ReactNode;
}

export function Row({ children }: RowProps) {
  return <div className="flex flex-row items-center gap-4">{children}</div>;
}
