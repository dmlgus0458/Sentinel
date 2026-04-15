package handler

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/labstack/echo/v4"
	"sentinel-backend/internal/model"
	"sentinel-backend/internal/service"
)

type WebhookHandler struct {
	alertSvc        *service.AlertService
	notificationSvc *service.NotificationService
	hub             *service.Hub
}

func NewWebhookHandler(
	alertSvc *service.AlertService,
	notificationSvc *service.NotificationService,
	hub *service.Hub,
) *WebhookHandler {
	return &WebhookHandler{
		alertSvc:        alertSvc,
		notificationSvc: notificationSvc,
		hub:             hub,
	}
}

func (h *WebhookHandler) HandleAlertmanager(c echo.Context) error {
	var payload service.AlertmanagerWebhookPayload
	if err := c.Bind(&payload); err != nil {
		return c.JSON(http.StatusBadRequest, apiError("INVALID_PAYLOAD", err.Error()))
	}

	ctx := c.Request().Context()
	events, err := h.alertSvc.ProcessWebhook(ctx, &payload)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, apiError("INTERNAL_ERROR", err.Error()))
	}

	for _, event := range events {
		h.broadcastEvent(event)
		go h.notificationSvc.SendAlertEmail(ctx, event)
	}

	return c.JSON(http.StatusOK, map[string]interface{}{"data": map[string]int{"processed": len(events)}})
}

func (h *WebhookHandler) broadcastEvent(event *model.AlertEvent) {
	sse := model.SseAlertEvent{
		ID:        event.ID,
		AlertName: event.AlertName,
		Severity:  event.Severity,
		Status:    event.Status,
		Instance:  event.Labels["instance"],
		StartsAt:  event.StartsAt.Format("2006-01-02T15:04:05Z07:00"),
	}
	data, err := json.Marshal(sse)
	if err != nil {
		return
	}
	msg := fmt.Sprintf("event: alert\ndata: %s\n\n", string(data))
	h.hub.Broadcast([]byte(msg))
}
