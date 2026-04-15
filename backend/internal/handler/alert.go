package handler

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
	"sentinel-backend/internal/model"
	"sentinel-backend/internal/service"
)

type AlertHandler struct {
	svc *service.AlertService
}

func NewAlertHandler(svc *service.AlertService) *AlertHandler {
	return &AlertHandler{svc: svc}
}

func (h *AlertHandler) ListAlerts(c echo.Context) error {
	params := model.AlertListParams{
		Severity: c.QueryParam("severity"),
		Status:   c.QueryParam("status"),
		From:     c.QueryParam("from"),
		To:       c.QueryParam("to"),
	}
	if p := c.QueryParam("page"); p != "" {
		if v, err := strconv.Atoi(p); err == nil {
			params.Page = v
		}
	}
	if l := c.QueryParam("limit"); l != "" {
		if v, err := strconv.Atoi(l); err == nil {
			params.Limit = v
		}
	}

	resp, err := h.svc.ListAlerts(c.Request().Context(), params)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, apiError("INTERNAL_ERROR", err.Error()))
	}
	return c.JSON(http.StatusOK, resp)
}

func (h *AlertHandler) GetAlert(c echo.Context) error {
	id, err := parseID(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, apiError("INVALID_ID", "invalid id"))
	}

	event, err := h.svc.GetAlert(c.Request().Context(), id)
	if err != nil {
		if errors.Is(err, service.ErrNotFound) {
			return c.JSON(http.StatusNotFound, apiError("NOT_FOUND", "alert not found"))
		}
		return c.JSON(http.StatusInternalServerError, apiError("INTERNAL_ERROR", err.Error()))
	}
	return c.JSON(http.StatusOK, map[string]interface{}{"data": event})
}

func (h *AlertHandler) AckAlert(c echo.Context) error {
	id, err := parseID(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, apiError("INVALID_ID", "invalid id"))
	}

	var req model.AckRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, apiError("INVALID_BODY", err.Error()))
	}
	if req.AckedBy == "" {
		return c.JSON(http.StatusBadRequest, apiError("VALIDATION_ERROR", "ackedBy is required"))
	}

	ack, err := h.svc.AckAlert(c.Request().Context(), id, &req)
	if err != nil {
		if errors.Is(err, service.ErrAlreadyAcked) {
			return c.JSON(http.StatusConflict, apiError("ALREADY_ACKED", "alert already acknowledged"))
		}
		return c.JSON(http.StatusInternalServerError, apiError("INTERNAL_ERROR", err.Error()))
	}
	return c.JSON(http.StatusOK, map[string]interface{}{"data": ack})
}

func (h *AlertHandler) ListComments(c echo.Context) error {
	id, err := parseID(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, apiError("INVALID_ID", "invalid id"))
	}

	comments, err := h.svc.ListComments(c.Request().Context(), id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, apiError("INTERNAL_ERROR", err.Error()))
	}
	return c.JSON(http.StatusOK, map[string]interface{}{"data": comments})
}

func (h *AlertHandler) AddComment(c echo.Context) error {
	id, err := parseID(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, apiError("INVALID_ID", "invalid id"))
	}

	var req model.CommentRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, apiError("INVALID_BODY", err.Error()))
	}
	if req.Author == "" || req.Body == "" {
		return c.JSON(http.StatusBadRequest, apiError("VALIDATION_ERROR", "author and body are required"))
	}

	comment, err := h.svc.AddComment(c.Request().Context(), id, &req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, apiError("INTERNAL_ERROR", err.Error()))
	}
	return c.JSON(http.StatusCreated, map[string]interface{}{"data": comment})
}

func parseID(s string) (int64, error) {
	return strconv.ParseInt(s, 10, 64)
}

func apiError(code, message string) map[string]interface{} {
	return map[string]interface{}{
		"code":    code,
		"message": message,
	}
}
