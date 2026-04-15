package handler

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"sentinel-backend/internal/model"
	"sentinel-backend/internal/service"
)

type NotificationHandler struct {
	svc *service.NotificationService
}

func NewNotificationHandler(svc *service.NotificationService) *NotificationHandler {
	return &NotificationHandler{svc: svc}
}

func (h *NotificationHandler) ListSettings(c echo.Context) error {
	settings, err := h.svc.ListSettings(c.Request().Context())
	if err != nil {
		return c.JSON(http.StatusInternalServerError, apiError("INTERNAL_ERROR", err.Error()))
	}
	return c.JSON(http.StatusOK, map[string]interface{}{"data": settings})
}

func (h *NotificationHandler) CreateSetting(c echo.Context) error {
	var req model.NotificationSettingRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, apiError("INVALID_BODY", err.Error()))
	}
	if req.Channel == "" || req.Target == "" {
		return c.JSON(http.StatusBadRequest, apiError("VALIDATION_ERROR", "channel and target are required"))
	}
	if req.SeverityFilter == nil {
		req.SeverityFilter = []string{}
	}

	setting, err := h.svc.CreateSetting(c.Request().Context(), &req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, apiError("INTERNAL_ERROR", err.Error()))
	}
	return c.JSON(http.StatusCreated, map[string]interface{}{"data": setting})
}

func (h *NotificationHandler) UpdateSetting(c echo.Context) error {
	id, err := parseID(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, apiError("INVALID_ID", "invalid id"))
	}

	var req model.NotificationSettingUpdateRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, apiError("INVALID_BODY", err.Error()))
	}

	setting, err := h.svc.UpdateSetting(c.Request().Context(), id, &req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, apiError("INTERNAL_ERROR", err.Error()))
	}
	return c.JSON(http.StatusOK, map[string]interface{}{"data": setting})
}

func (h *NotificationHandler) DeleteSetting(c echo.Context) error {
	id, err := parseID(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, apiError("INVALID_ID", "invalid id"))
	}

	if err := h.svc.DeleteSetting(c.Request().Context(), id); err != nil {
		return c.JSON(http.StatusInternalServerError, apiError("INTERNAL_ERROR", err.Error()))
	}
	return c.NoContent(http.StatusNoContent)
}
