import { Fragment, useMemo, useRef, useState } from "react";
import { Root } from "react-dom/client";
import { nanoid } from "nanoid";

import { Factory } from "@/lib/factory";
import { makeMap } from "@/lib/iterable";

const toChildren = makeMap(([id, node]: [string, React.ReactNode]) => (
  <Fragment key={id}>{node}</Fragment>
));

export function useRootFactory() {
  const [map, setMap] = useState(new Map<string, React.ReactNode>());
  const factoryRef = useRef<Factory<void, Root>>({
    Create() {
      const id = nanoid();
      const root: Root = {
        render(children) {
          setMap((m) => new Map(m).set(id, children));
        },
        unmount() {
          setMap((m) => {
            const newMap = new Map(m);
            newMap.delete(id);
            return newMap;
          });
        },
      };
      return root;
    },
  });
  const children = useMemo(() => Array.from(toChildren(map)), [map]);
  return [factoryRef, children] as const;
}
