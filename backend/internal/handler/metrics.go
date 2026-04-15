package handler

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"sentinel-backend/internal/service"
)

type MetricsHandler struct {
	svc *service.MetricsService
}

func NewMetricsHandler(svc *service.MetricsService) *MetricsHandler {
	return &MetricsHandler{svc: svc}
}

func (h *MetricsHandler) QueryInstant(c echo.Context) error {
	query := c.QueryParam("query")
	if query == "" {
		return c.JSON(http.StatusBadRequest, apiError("MISSING_PARAM", "query is required"))
	}
	timeParam := c.QueryParam("time")

	raw, err := h.svc.QueryInstant(c.Request().Context(), query, timeParam)
	if err != nil {
		return c.JSON(http.StatusBadGateway, apiError("PROMETHEUS_ERROR", err.Error()))
	}
	return c.JSONBlob(http.StatusOK, raw)
}

func (h *MetricsHandler) QueryRange(c echo.Context) error {
	query := c.QueryParam("query")
	start := c.QueryParam("start")
	end := c.QueryParam("end")
	step := c.QueryParam("step")

	if query == "" || start == "" || end == "" || step == "" {
		return c.JSON(http.StatusBadRequest, apiError("MISSING_PARAM", "query, start, end, step are required"))
	}

	raw, err := h.svc.QueryRange(c.Request().Context(), query, start, end, step)
	if err != nil {
		return c.JSON(http.StatusBadGateway, apiError("PROMETHEUS_ERROR", err.Error()))
	}
	return c.JSONBlob(http.StatusOK, raw)
}

func (h *MetricsHandler) GetNodes(c echo.Context) error {
	nodes, err := h.svc.GetNodeMetrics(c.Request().Context())
	if err != nil {
		return c.JSON(http.StatusBadGateway, apiError("PROMETHEUS_ERROR", err.Error()))
	}
	if nodes == nil {
		nodes = []service.NodeMetric{}
	}
	return c.JSON(http.StatusOK, map[string]interface{}{"data": nodes})
}

func (h *MetricsHandler) GetInfraStatus(c echo.Context) error {
	infraType := c.QueryParam("type")
	result, err := h.svc.GetInfraStatus(c.Request().Context(), infraType)
	if err != nil {
		return c.JSON(http.StatusBadGateway, apiError("PROMETHEUS_ERROR", err.Error()))
	}
	return c.JSON(http.StatusOK, result)
}
