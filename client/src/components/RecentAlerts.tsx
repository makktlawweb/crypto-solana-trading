import { useQuery, useMutation } from "@tanstack/react-query";
import { Bell, ArrowRight, CheckCircle, AlertCircle, XCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";

export default function RecentAlerts() {
  const { toast } = useToast();

  const { data: alerts = [] } = useQuery({
    queryKey: ["/api/alerts"],
    refetchInterval: 5000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (alertId: number) => {
      const response = await apiRequest("PATCH", `/api/alerts/${alertId}/read`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
    },
  });

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "success":
        return <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />;
      case "warning":
        return <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />;
      case "error":
        return <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />;
      default:
        return <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />;
    }
  };

  const getAlertIconLarge = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "warning":
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case "error":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  // Show only recent alerts (last 10)
  const recentAlerts = alerts.slice(0, 10);

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <Bell className="text-primary" />
          <span>Recent Alerts</span>
          {alerts.filter((alert: any) => !alert.isRead).length > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {alerts.filter((alert: any) => !alert.isRead).length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentAlerts.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No alerts yet</p>
              <p className="text-sm">Start monitoring to receive trading alerts</p>
            </div>
          ) : (
            recentAlerts.map((alert: any) => (
              <div 
                key={alert.id} 
                className={`flex items-start space-x-3 p-3 rounded-lg transition-colors ${
                  alert.isRead ? 'bg-gray-750' : 'bg-gray-700 border-l-2 border-primary'
                }`}
                onClick={() => !alert.isRead && markAsReadMutation.mutate(alert.id)}
              >
                {getAlertIcon(alert.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2">
                      {getAlertIconLarge(alert.type)}
                      <div>
                        <p className={`text-sm ${alert.isRead ? 'text-gray-300' : 'text-white font-medium'}`}>
                          {alert.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {alert.timestamp ? formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true }) : 'Just now'}
                        </p>
                      </div>
                    </div>
                    {!alert.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:text-primary/80 p-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsReadMutation.mutate(alert.id);
                        }}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {alerts.length > 10 && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <Button 
              variant="ghost" 
              className="text-primary hover:text-primary/80 text-sm"
            >
              View all alerts ({alerts.length}) <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
