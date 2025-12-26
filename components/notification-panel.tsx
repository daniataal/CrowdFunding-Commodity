"use client"

import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { NotificationItem } from "@/lib/domain"
import { Bell, DollarSign, Package, TrendingUp, AlertTriangle, Settings, Check, X } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export function NotificationPanel() {
  const qc = useQueryClient()

  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications")
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to load notifications")
      return json.data as NotificationItem[]
    },
  })

  const notifications = notificationsQuery.data ?? []
  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications])

  const getIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "dividend":
        return <DollarSign className="h-4 w-4 text-emerald-500" />
      case "shipment":
        return <Package className="h-4 w-4 text-blue-500" />
      case "investment":
        return <TrendingUp className="h-4 w-4 text-purple-500" />
      case "alert":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />
      case "system":
        return <Settings className="h-4 w-4 text-slate-500" />
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
      return `${diffInMinutes}m ago`
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays}d ago`
    }
  }

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to mark as read")
      return json.data as NotificationItem
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  })

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to mark all as read")
      return json
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  })

  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/notifications/${id}`, { method: "DELETE" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to delete notification")
      return json
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  })

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 p-0 text-xs text-white">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div>
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && <p className="text-xs text-muted-foreground">{unreadCount} unread</p>}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              className="h-8 text-xs"
              disabled={markAllAsReadMutation.isPending}
            >
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {notificationsQuery.isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground">Loading…</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="mb-2 h-12 w-12 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`group relative p-4 transition-colors hover:bg-muted/50 ${!notification.read ? "bg-emerald-500/5" : ""}`}
                >
                  <div className="flex gap-3">
                    <div className="mt-0.5">{getIcon(notification.type)}</div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-tight">{notification.title}</p>
                        {!notification.read && <div className="h-2 w-2 flex-shrink-0 rounded-full bg-emerald-500" />}
                      </div>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                      <p className="text-xs text-muted-foreground">{formatTimestamp(notification.timestamp)}</p>
                    </div>
                  </div>
                  <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => markAsReadMutation.mutate(notification.id)}
                        disabled={markAsReadMutation.isPending}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-500 hover:text-red-400"
                      onClick={() => deleteNotificationMutation.mutate(notification.id)}
                      disabled={deleteNotificationMutation.isPending}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
