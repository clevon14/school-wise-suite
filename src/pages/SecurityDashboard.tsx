import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, CheckCircle, XCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ComplianceCheck {
  id: string;
  check_name: string;
  is_compliant: boolean;
  last_checked: string;
  details: {
    description?: string;
    last_violation?: string;
    violations_count?: number;
  };
}

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  is_suspicious: boolean;
  security_flags: string[];
  details: any;
  created_at: string;
}

export default function SecurityDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch compliance status
  const { data: complianceChecks = [], isLoading: loadingCompliance } = useQuery({
    queryKey: ["security-compliance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("security_compliance")
        .select("*")
        .order("check_name");
      if (error) throw error;
      return (data || []).map((item: any) => ({
        ...item,
        details: typeof item.details === 'string' ? JSON.parse(item.details) : item.details,
      })) as ComplianceCheck[];
    },
  });

  // Fetch suspicious audit logs
  const { data: suspiciousLogs = [] } = useQuery({
    queryKey: ["suspicious-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("is_suspicious", true)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as AuditLog[];
    },
  });

  // Fetch rate limit violations
  const { data: rateLimits = [] } = useQuery({
    queryKey: ["rate-limits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rate_limits")
        .select("*")
        .gte("window_start", new Date(Date.now() - 3600000).toISOString())
        .order("request_count", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  // Refresh compliance check
  const refreshMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("security_compliance")
        .update({ last_checked: new Date().toISOString() })
        .neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["security-compliance"] });
      toast({ title: "Security checks refreshed" });
    },
  });

  const complianceScore = complianceChecks.length > 0
    ? Math.round((complianceChecks.filter((c) => c.is_compliant).length / complianceChecks.length) * 100)
    : 0;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Security & Privacy Dashboard
          </h1>
          <p className="text-muted-foreground">Monitor compliance and security status</p>
        </div>
        <Button onClick={() => refreshMutation.mutate()} disabled={refreshMutation.isPending}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Checks
        </Button>
      </div>

      {/* Compliance Score Card */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Security Compliance</CardTitle>
          <CardDescription>Current security posture and compliance status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{complianceScore}%</span>
              <Badge variant={complianceScore === 100 ? "default" : complianceScore >= 80 ? "secondary" : "destructive"}>
                {complianceScore === 100 ? "Excellent" : complianceScore >= 80 ? "Good" : "Needs Attention"}
              </Badge>
            </div>
            <Progress value={complianceScore} className="h-2" />
            <p className="text-sm text-muted-foreground">
              {complianceChecks.filter((c) => c.is_compliant).length} of {complianceChecks.length} checks passing
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="checklist">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="checklist">Security Checklist</TabsTrigger>
          <TabsTrigger value="audit">Suspicious Activity</TabsTrigger>
          <TabsTrigger value="rate-limits">Rate Limits</TabsTrigger>
        </TabsList>

        <TabsContent value="checklist" className="space-y-4">
          {loadingCompliance ? (
            <p>Loading compliance checks...</p>
          ) : (
            complianceChecks.map((check) => (
              <Card key={check.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {check.is_compliant ? (
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      )}
                      <div className="space-y-1">
                        <h3 className="font-semibold capitalize">
                          {check.check_name.replace(/_/g, " ")}
                        </h3>
                        <p className="text-sm text-muted-foreground">{check.details?.description || "No description available"}</p>
                        {check.details.violations_count && (
                          <Badge variant="destructive" className="text-xs">
                            {check.details.violations_count} violations detected
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Badge variant={check.is_compliant ? "default" : "destructive"}>
                      {check.is_compliant ? "Compliant" : "Action Required"}
                    </Badge>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Last checked: {new Date(check.last_checked).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          {/* Security Best Practices */}
          <Card>
            <CardHeader>
              <CardTitle>Security Best Practices</CardTitle>
              <CardDescription>Recommended security measures for your application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Row-Level Security (RLS)
                </h4>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li>Parents can only access their own children's data</li>
                  <li>Teachers can only access students in assigned classes</li>
                  <li>Admins have full access to all student records</li>
                  <li>All queries are filtered at the database level</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  PII Masking
                </h4>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li>Email addresses masked for non-admin roles</li>
                  <li>Phone numbers redacted in AI responses</li>
                  <li>Student names anonymized when appropriate</li>
                  <li>Full PII only visible to authorized roles</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Audit & Monitoring
                </h4>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li>All AI queries logged with fields accessed</li>
                  <li>Suspicious export patterns flagged</li>
                  <li>Environment secrets never sent to LLM</li>
                  <li>Real-time monitoring of security events</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Rate Limiting
                </h4>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li>RAG queries: 60 requests per minute per user</li>
                  <li>CSV exports: 10 requests per minute per user</li>
                  <li>Embedding uploads: 20 requests per minute</li>
                  <li>Automatic throttling on violation</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Suspicious Activity Log
              </CardTitle>
              <CardDescription>Recent security events requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {suspiciousLogs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-600" />
                    <p>No suspicious activity detected</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {suspiciousLogs.map((log) => (
                      <Card key={log.id} className="border-orange-200 bg-orange-50">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <p className="font-medium">{log.action} on {log.resource_type}</p>
                              <p className="text-sm text-muted-foreground">
                                User ID: {log.user_id.substring(0, 8)}...
                              </p>
                              {log.security_flags && log.security_flags.length > 0 && (
                                <div className="flex gap-1 mt-2">
                                  {log.security_flags.map((flag, idx) => (
                                    <Badge key={idx} variant="destructive" className="text-xs">
                                      {flag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(log.created_at).toLocaleString()}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rate-limits">
          <Card>
            <CardHeader>
              <CardTitle>Rate Limit Activity</CardTitle>
              <CardDescription>Recent API usage and rate limiting events</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {rateLimits.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No rate limit data available</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {rateLimits.map((limit: any) => (
                      <Card key={limit.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <p className="font-medium">{limit.endpoint}</p>
                              <p className="text-sm text-muted-foreground">
                                User ID: {limit.user_id.substring(0, 8)}...
                              </p>
                              <p className="text-sm">
                                Requests: {limit.request_count} in current window
                              </p>
                            </div>
                            <Badge variant={limit.request_count > 50 ? "destructive" : "default"}>
                              {limit.request_count > 50 ? "High Usage" : "Normal"}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
