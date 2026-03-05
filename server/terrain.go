package main

// Must match constants in hello-world/src/terrain-noise.js exactly.
const (
	terrainScale       = 0.04
	terrainAmplitude   = 5.0
	terrainOctaves     = 4
	terrainLacunarity  = 2.0
	terrainPersistence = 0.5
)

var noiseGen = newSimplexNoise(uint32(terrainSeed))

func terrainHeight(x, z float64) float64 {
	value := 0.0
	amplitude := 1.0
	frequency := 1.0
	max := 0.0

	for i := 0; i < terrainOctaves; i++ {
		value += noiseGen.noise2D(x*terrainScale*frequency, z*terrainScale*frequency) * amplitude
		max += amplitude
		amplitude *= terrainPersistence
		frequency *= terrainLacunarity
	}

	return (value / max) * terrainAmplitude
}
