package main

import (
	"math"
	"testing"
)

func TestTerrainHeightDeterministic(t *testing.T) {
	// Same input must always produce the same output.
	y1 := terrainHeight(10, 20)
	y2 := terrainHeight(10, 20)
	if y1 != y2 {
		t.Fatalf("terrainHeight not deterministic: %f != %f", y1, y2)
	}
}

func TestTerrainHeightWithinAmplitude(t *testing.T) {
	coords := [][2]float64{
		{0, 0}, {100, 100}, {-50, 30}, {0.5, -0.5}, {999, -999},
	}
	for _, c := range coords {
		y := terrainHeight(c[0], c[1])
		if math.Abs(y) > terrainAmplitude {
			t.Errorf("terrainHeight(%g, %g) = %f exceeds amplitude %f", c[0], c[1], y, terrainAmplitude)
		}
	}
}

func TestTerrainHeightSymmetry(t *testing.T) {
	// Different positions should generally give different heights.
	y1 := terrainHeight(10, 20)
	y2 := terrainHeight(20, 10)
	if y1 == y2 {
		t.Error("terrainHeight(10,20) == terrainHeight(20,10); expected different values")
	}
}

func TestTerrainHeightVariesWithPosition(t *testing.T) {
	y1 := terrainHeight(0, 0)
	y2 := terrainHeight(50, 50)
	if y1 == y2 {
		t.Error("terrainHeight returned same value for different positions")
	}
}
