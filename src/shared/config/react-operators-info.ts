import { useQuery } from '@tanstack/react-query';

import { OperatorInfo, data } from './operators-info';

export function useOperators() {
  return useQuery<OperatorInfo[]>({
    queryKey: ["/operators.json"],
    queryFn: () => fetch("/operators.json").then((res) => res.json()),
    initialData: data,
    enabled: import.meta.env.PROD,
  });
}