import { Lightbulb, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function NewTradeStudyPage() {
  return (
    <div className="mx-auto max-w-screen-md px-4 py-10 sm:py-14">
      <Card>
        <CardHeader>
          <CardTitle>Create a new trade study</CardTitle>
          <CardDescription>
            Stubbed form. Persist to Postgres via Prisma models and add AI agent calls when wiring up.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" placeholder="Cloud data warehouse selection" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="summary">Summary</Label>
            <Input id="summary" placeholder="Why we are evaluating these options" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="json">Trade study JSON</Label>
            <textarea
              id="json"
              className="h-48 w-full rounded-md border bg-background px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              defaultValue={JSON.stringify({ requirements: [], options: [] }, null, 2)}
            />
            <p className="text-xs text-muted-foreground">
              Persist this JSON to `TradeStudy.data` and keep it as the source of truth for the agent.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button className="gap-2">
              <Save className="h-4 w-4" />
              Save stub
            </Button>
            <Button variant="outline" className="gap-2">
              <Lightbulb className="h-4 w-4" />
              Ask agent (stub)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
