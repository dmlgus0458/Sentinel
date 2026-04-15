package handler

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"sentinel-backend/internal/service"
)

type DashboardHandler struct {
	alertSvc *service.AlertService
}

func NewDashboardHandler(alertSvc *service.AlertService) *DashboardHandler {
	return &DashboardHandler{alertSvc: alertSvc}
}

func (h *DashboardHandler) GetStats(c echo.Context) error {
	stats, err := h.alertSvc.GetDashboardStats(c.Request().Context())
	if err != nil {
		return c.JSON(http.StatusInternalServerError, apiError("DB_ERROR", err.Error()))
	}
	return c.JSON(http.StatusOK, stats)
}

func (h *DashboardHandler) GetHeatmap(c echo.Context) error {
	cells, err := h.alertSvc.GetHeatmapData(c.Request().Context())
	if err != nil {
		return c.JSON(http.StatusInternalServerError, apiError("DB_ERROR", err.Error()))
	}
	return c.JSON(http.StatusOK, map[string]interface{}{"data": cells})
}
