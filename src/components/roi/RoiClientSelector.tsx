import * as React from "react";
import { Search, UserCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Client } from "@/types/imani";

interface RoiClientSelectorProps {
  clients: Client[];
  onSelect: (clientId: string) => void;
}

export function RoiClientSelector({ clients, onSelect }: RoiClientSelectorProps) {
  const [search, setSearch] = React.useState("");

  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 p-4">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Select a Client</h1>
        <p className="text-muted-foreground">
          Choose a client to manage their KPIs and track performance.
        </p>
      </div>

      <div className="w-full max-w-2xl space-y-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            className="pl-10 h-12 rounded-2xl bg-white/70 backdrop-blur-sm border-border/70 shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <button
              key={client.id}
              onClick={() => onSelect(client.id)}
              className="flex flex-col items-center gap-3 p-6 rounded-3xl bg-white/70 border border-border/70 hover:border-primary/50 hover:bg-primary/5 transition-all group shadow-sm active:scale-95"
            >
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <UserCircle className="h-6 w-6" />
              </div>
              <div className="text-sm font-semibold text-center line-clamp-2">
                {client.name}
              </div>
            </button>
          ))}
          {filteredClients.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              No clients found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
