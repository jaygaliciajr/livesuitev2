"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function SubscriptionModule() {
  const [plan, setPlan] = useState("Regular");

  useEffect(() => {
    const raw = window.localStorage.getItem("ls-plan");
    if (raw) setPlan(raw);
  }, []);

  function setNextPlan(nextPlan: "Regular" | "Premium") {
    setPlan(nextPlan);
    window.localStorage.setItem("ls-plan", nextPlan);
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold">Subscription</h1>
        <p className="text-sm text-muted">Choose your plan tier for the store workflow.</p>
      </header>

      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Current Plan</h2>
          <Badge tone={plan === "Premium" ? "success" : "default"}>{plan}</Badge>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant={plan === "Regular" ? "primary" : "secondary"} onClick={() => setNextPlan("Regular")}>Regular</Button>
          <Button variant={plan === "Premium" ? "primary" : "secondary"} onClick={() => setNextPlan("Premium")}>Premium</Button>
        </div>
      </Card>

      <Card className="space-y-1">
        <p className="text-sm font-semibold">Plan Details</p>
        <p className="text-sm text-muted">Regular: Fast encoding + dashboard + basic exports.</p>
        <p className="text-sm text-muted">Premium: Adds advanced analytics, automation, and multi-encoder controls.</p>
      </Card>
    </div>
  );
}
