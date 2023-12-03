import { useDeferredValue, useState } from "react";

import { Docs } from "@/shared/config/docs";

import { SideBar } from "./sidebar";

export function DocsPage() {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  return (
    <div className="h-screen mx-auto grid grid-cols-[minmax(300px,3fr)_14fr] overflow-hidden">
      <div className="h-full flex flex-col bg-slate-200 overflow-hidden text-lg overflow-y-scroll">
        <div className="p-2 sticky top-0">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-2 h-12 rounded shadow-md"
            placeholder="Search"
          />
        </div>
        <SideBar className="grow py-4 px-4" search={deferredSearch} />
      </div>
      <div className="py-3 px-8 overflow-auto">
        <Docs />
      </div>
    </div>
  );
}
