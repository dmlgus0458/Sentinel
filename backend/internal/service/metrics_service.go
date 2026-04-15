package service

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"math"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"
)

type MetricsService struct {
	prometheusURL string
	httpClient    *http.Client
}

func NewMetricsService(prometheusURL string) *MetricsService {
	return &MetricsService{
		prometheusURL: prometheusURL,
		httpClient:    &http.Client{},
	}
}

type NodeMetric struct {
	Instance    string  `json:"instance"`
	Role        string  `json:"role,omitempty"`
	CPUUsage    float64 `json:"cpuUsage"`
	MemoryUsage float64 `json:"memoryUsage"`
	DiskUsage   float64 `json:"diskUsage"`
}

func (s *MetricsService) QueryInstant(ctx context.Context, query, timeParam string) (json.RawMessage, error) {
	params := url.Values{}
	params.Set("query", query)
	if timeParam != "" {
		params.Set("time", timeParam)
	}
	return s.doRequest(ctx, "/api/v1/query", params)
}

func toUnixTimestamp(s string) string {
	if t, err := time.Parse(time.RFC3339, s); err == nil {
		return fmt.Sprintf("%d", t.Unix())
	}
	return s
}

func (s *MetricsService) QueryRange(ctx context.Context, query, start, end, step string) (json.RawMessage, error) {
	params := url.Values{}
	params.Set("query", query)
	params.Set("start", toUnixTimestamp(start))
	params.Set("end", toUnixTimestamp(end))
	params.Set("step", step)
	return s.doRequest(ctx, "/api/v1/query_range", params)
}

func (s *MetricsService) GetNodeMetrics(ctx context.Context) ([]NodeMetric, error) {
	cpuQuery := `100 - (avg by(instance, role) (rate(node_cpu_seconds_total{mode="idle",job="node-exporter"}[5m])) * 100)`
	memQuery := `(1 - (node_memory_MemAvailable_bytes{job="node-exporter"} / node_memory_MemTotal_bytes{job="node-exporter"})) * 100`
	diskQuery := `(1 - (node_filesystem_avail_bytes{mountpoint="/",job="node-exporter"} / node_filesystem_size_bytes{mountpoint="/",job="node-exporter"})) * 100`

	cpuVals, cpuRoles, err := s.queryToMapWithRole(ctx, cpuQuery)
	if err != nil {
		return nil, fmt.Errorf("cpu query: %w", err)
	}
	memMap, err := s.queryToMap(ctx, memQuery)
	if err != nil {
		return nil, fmt.Errorf("memory query: %w", err)
	}
	diskMap, err := s.queryToMap(ctx, diskQuery)
	if err != nil {
		return nil, fmt.Errorf("disk query: %w", err)
	}

	instanceSet := map[string]struct{}{}
	for k := range cpuVals {
		instanceSet[k] = struct{}{}
	}
	for k := range memMap {
		instanceSet[k] = struct{}{}
	}
	for k := range diskMap {
		instanceSet[k] = struct{}{}
	}

	var nodes []NodeMetric
	for instance := range instanceSet {
		nodes = append(nodes, NodeMetric{
			Instance:    instance,
			Role:        cpuRoles[instance],
			CPUUsage:    math.Round(cpuVals[instance]*10) / 10,
			MemoryUsage: math.Round(memMap[instance]*10) / 10,
			DiskUsage:   math.Round(diskMap[instance]*10) / 10,
		})
	}
	return nodes, nil
}

func (s *MetricsService) queryToMap(ctx context.Context, query string) (map[string]float64, error) {
	raw, err := s.QueryInstant(ctx, query, "")
	if err != nil {
		return nil, err
	}

	var resp struct {
		Status string `json:"status"`
		Data   struct {
			ResultType string `json:"resultType"`
			Result     []struct {
				Metric map[string]string `json:"metric"`
				Value  []interface{}     `json:"value"`
			} `json:"result"`
		} `json:"data"`
	}
	if err := json.Unmarshal(raw, &resp); err != nil {
		return nil, err
	}

	result := map[string]float64{}
	for _, item := range resp.Data.Result {
		instance := item.Metric["instance"]
		if len(item.Value) >= 2 {
			valStr, ok := item.Value[1].(string)
			if ok {
				if v, err := strconv.ParseFloat(valStr, 64); err == nil {
					result[instance] = v
				}
			}
		}
	}
	return result, nil
}

func (s *MetricsService) queryToMapWithRole(ctx context.Context, query string) (vals map[string]float64, roles map[string]string, err error) {
	raw, err := s.QueryInstant(ctx, query, "")
	if err != nil {
		return nil, nil, err
	}

	var resp struct {
		Status string `json:"status"`
		Data   struct {
			ResultType string `json:"resultType"`
			Result     []struct {
				Metric map[string]string `json:"metric"`
				Value  []interface{}     `json:"value"`
			} `json:"result"`
		} `json:"data"`
	}
	if err := json.Unmarshal(raw, &resp); err != nil {
		return nil, nil, err
	}

	vals = map[string]float64{}
	roles = map[string]string{}
	for _, item := range resp.Data.Result {
		instance := item.Metric["instance"]
		role := item.Metric["role"]
		if len(item.Value) >= 2 {
			valStr, ok := item.Value[1].(string)
			if ok {
				if v, err2 := strconv.ParseFloat(valStr, 64); err2 == nil {
					vals[instance] = v
					roles[instance] = role
				}
			}
		}
	}
	return vals, roles, nil
}

func (s *MetricsService) doRequest(ctx context.Context, path string, params url.Values) (json.RawMessage, error) {
	reqURL := s.prometheusURL + path + "?" + params.Encode()
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, reqURL, nil)
	if err != nil {
		return nil, err
	}

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	return body, nil
}

type InfraService struct {
	Name     string `json:"name"`
	Instance string `json:"instance"`
	Role     string `json:"role,omitempty"`
	Up       bool   `json:"up"`
}

type InfraTypeStatus struct {
	Type     string         `json:"type"`
	Label    string         `json:"label"`
	Total    int            `json:"total"`
	Up       int            `json:"up"`
	Services []InfraService `json:"services"`
}

type InfraStatusResponse struct {
	Types []InfraTypeStatus `json:"types"`
}

var infraJobs = []struct {
	typeKey string
	label   string
	job     string
}{
	{"node", "HOSTS", "node-exporter"},
	{"postgres", "POSTGRES", "postgres-exporter"},
	{"redis", "REDIS", "redis-exporter"},
	{"kafka", "KAFKA", "kafka-exporter"},
	{"kong", "KONG", "kong-plugin"},
	{"keycloak", "KEYCLOAK", "keycloak"},
	{"prometheus", "PROMETHEUS", "prometheus"},
	{"vdiagent", "VDI AGENT", "usp-dv-vdiagent"},
}

func (s *MetricsService) GetInfraStatus(ctx context.Context, infraType string) (*InfraStatusResponse, error) {
	var targets []struct {
		typeKey string
		label   string
		job     string
	}

	if infraType == "all" || infraType == "" {
		targets = infraJobs
	} else {
		for _, j := range infraJobs {
			if j.typeKey == infraType {
				targets = append(targets, j)
				break
			}
		}
	}

	var types []InfraTypeStatus
	for _, t := range targets {
		status, err := s.getJobStatus(ctx, t.job)
		if err != nil || status.Total == 0 {
			continue
		}
		status.Type = t.typeKey
		status.Label = t.label
		types = append(types, *status)
	}

	if types == nil {
		types = []InfraTypeStatus{}
	}
	return &InfraStatusResponse{Types: types}, nil
}

func (s *MetricsService) getJobStatus(ctx context.Context, job string) (*InfraTypeStatus, error) {
	raw, err := s.QueryInstant(ctx, fmt.Sprintf(`up{job="%s"}`, job), "")
	if err != nil {
		return nil, err
	}

	var resp struct {
		Status string `json:"status"`
		Data   struct {
			Result []struct {
				Metric map[string]string `json:"metric"`
				Value  []interface{}     `json:"value"`
			} `json:"result"`
		} `json:"data"`
	}
	if err := json.Unmarshal(raw, &resp); err != nil {
		return nil, err
	}

	status := &InfraTypeStatus{}
	for _, item := range resp.Data.Result {
		instance := item.Metric["instance"]
		role := item.Metric["role"]

		name := role
		if name == "" {
			name = strings.Split(instance, ":")[0]
		}

		up := false
		if len(item.Value) >= 2 {
			if v, ok := item.Value[1].(string); ok && v == "1" {
				up = true
			}
		}

		status.Total++
		if up {
			status.Up++
		}
		status.Services = append(status.Services, InfraService{
			Name:     name,
			Instance: instance,
			Role:     role,
			Up:       up,
		})
	}
	if status.Services == nil {
		status.Services = []InfraService{}
	}
	return status, nil
}
