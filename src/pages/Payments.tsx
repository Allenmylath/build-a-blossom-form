import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CreditCard, DollarSign, Download, Receipt } from "lucide-react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

export default function Payments() {
  const { user } = useSupabaseAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "billing" | "invoices">("overview");

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>
              Please sign in to view your payment information.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
        <p className="text-muted-foreground">
          Manage your billing, subscriptions, and payment history.
        </p>
      </div>

      <div className="flex gap-4 border-b">
        <Button
          variant={activeTab === "overview" ? "default" : "ghost"}
          onClick={() => setActiveTab("overview")}
          className="rounded-b-none"
        >
          Overview
        </Button>
        <Button
          variant={activeTab === "billing" ? "default" : "ghost"}
          onClick={() => setActiveTab("billing")}
          className="rounded-b-none"
        >
          Billing
        </Button>
        <Button
          variant={activeTab === "invoices" ? "default" : "ghost"}
          onClick={() => setActiveTab("invoices")}
          className="rounded-b-none"
        >
          Invoices
        </Button>
      </div>

      {activeTab === "overview" && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Free Plan</div>
              <p className="text-xs text-muted-foreground">
                Upgrade for more features
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Spend</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0.00</div>
              <p className="text-xs text-muted-foreground">
                No charges this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Next Billing</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground">
                No active subscription
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "billing" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Plans</CardTitle>
              <CardDescription>
                Choose the plan that best fits your needs.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 border rounded-lg">
                  <div className="space-y-2">
                    <h3 className="font-semibold">Free</h3>
                    <div className="text-2xl font-bold">$0<span className="text-sm font-normal">/month</span></div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Up to 3 forms</li>
                      <li>• 100 submissions/month</li>
                      <li>• Basic analytics</li>
                    </ul>
                    <Badge variant="secondary">Current Plan</Badge>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="space-y-2">
                    <h3 className="font-semibold">Pro</h3>
                    <div className="text-2xl font-bold">$9<span className="text-sm font-normal">/month</span></div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Unlimited forms</li>
                      <li>• 1,000 submissions/month</li>
                      <li>• Advanced analytics</li>
                      <li>• Custom branding</li>
                    </ul>
                    <Button className="w-full">Upgrade to Pro</Button>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="space-y-2">
                    <h3 className="font-semibold">Enterprise</h3>
                    <div className="text-2xl font-bold">$29<span className="text-sm font-normal">/month</span></div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Everything in Pro</li>
                      <li>• Unlimited submissions</li>
                      <li>• Priority support</li>
                      <li>• API access</li>
                    </ul>
                    <Button className="w-full">Contact Sales</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
              <CardDescription>
                Manage your payment methods and billing information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5" />
                  <span className="text-sm text-muted-foreground">No payment method added</span>
                </div>
                <Button variant="outline" size="sm">Add Card</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "invoices" && (
        <Card>
          <CardHeader>
            <CardTitle>Invoice History</CardTitle>
            <CardDescription>
              View and download your past invoices.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No invoices yet</h3>
              <p className="text-muted-foreground">
                Your invoice history will appear here once you start a subscription.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}