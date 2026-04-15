package handler

import (
	"fmt"
	"net/http"

	"github.com/labstack/echo/v4"
	"sentinel-backend/internal/service"
)

type StreamHandler struct {
	hub *service.Hub
}

func NewStreamHandler(hub *service.Hub) *StreamHandler {
	return &StreamHandler{hub: hub}
}

func (h *StreamHandler) Stream(c echo.Context) error {
	c.Response().Header().Set("Content-Type", "text/event-stream")
	c.Response().Header().Set("Cache-Control", "no-cache")
	c.Response().Header().Set("Connection", "keep-alive")
	c.Response().Header().Set("X-Accel-Buffering", "no")
	c.Response().WriteHeader(http.StatusOK)

	client := make(chan []byte, 64)
	h.hub.Register(client)
	defer h.hub.Unregister(client)

	// Send initial ping
	fmt.Fprintf(c.Response(), ": ping\n\n")
	c.Response().Flush()

	ctx := c.Request().Context()
	for {
		select {
		case <-ctx.Done():
			return nil
		case msg, ok := <-client:
			if !ok {
				return nil
			}
			_, err := fmt.Fprintf(c.Response(), "%s", msg)
			if err != nil {
				return nil
			}
			c.Response().Flush()
		}
	}
}
