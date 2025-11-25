import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Bell, Mail, MessageSquare, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Notifications() {
  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select(`
          *,
          sender:employees!notifications_sent_by_fkey(first_name, last_name)
        `)
        .order("sent_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <MessageSquare className="h-4 w-4" />;
      case 'push': return <Bell className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'normal': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const all = notifications || [];
  const announcements = notifications?.filter(n => n.notification_type === 'announcement') || [];
  const alerts = notifications?.filter(n => n.notification_type === 'alert') || [];
  const reminders = notifications?.filter(n => n.notification_type === 'reminder') || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Notifications</h2>
          <p className="text-muted-foreground">Send and manage school-wide communications</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Notification
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{all.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Announcements</CardTitle>
            <Bell className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{announcements.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alerts</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reminders</CardTitle>
            <MessageSquare className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reminders.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All ({all.length})</TabsTrigger>
          <TabsTrigger value="announcements">Announcements ({announcements.length})</TabsTrigger>
          <TabsTrigger value="alerts">Alerts ({alerts.length})</TabsTrigger>
          <TabsTrigger value="reminders">Reminders ({reminders.length})</TabsTrigger>
        </TabsList>

        {['all', 'announcements', 'alerts', 'reminders'].map((tab) => {
          const data = tab === 'all' ? all : 
                      tab === 'announcements' ? announcements :
                      tab === 'alerts' ? alerts : reminders;
          
          return (
            <TabsContent key={tab} value={tab} className="space-y-4">
              {isLoading ? (
                <Card>
                  <CardContent className="p-6">
                    <p>Loading notifications...</p>
                  </CardContent>
                </Card>
              ) : data.length > 0 ? (
                <div className="space-y-3">
                  {data.map((notification: any) => (
                    <Card key={notification.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                              <Badge variant={getPriorityColor(notification.priority)}>
                                {notification.priority}
                              </Badge>
                              <h4 className="font-semibold">{notification.title}</h4>
                            </div>
                            
                            <p className="text-sm text-muted-foreground">{notification.message}</p>
                            
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              {notification.sender && (
                                <span>
                                  From: {notification.sender.first_name} {notification.sender.last_name}
                                </span>
                              )}
                              <span>
                                Sent: {new Date(notification.sent_at).toLocaleString()}
                              </span>
                              {notification.target_role && (
                                <span>
                                  To: {notification.target_role.join(', ')}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {notification.is_email && (
                                <Badge variant="outline" className="text-xs">
                                  <Mail className="h-3 w-3 mr-1" />
                                  Email
                                </Badge>
                              )}
                              {notification.is_sms && (
                                <Badge variant="outline" className="text-xs">
                                  <MessageSquare className="h-3 w-3 mr-1" />
                                  SMS
                                </Badge>
                              )}
                              {notification.is_push && (
                                <Badge variant="outline" className="text-xs">
                                  <Bell className="h-3 w-3 mr-1" />
                                  Push
                                </Badge>
                              )}
                            </div>
                          </div>

                          <Button variant="ghost" size="sm">
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6">
                    <p className="text-center text-muted-foreground">No notifications in this category</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
