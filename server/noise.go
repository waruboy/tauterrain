package main

import "math"

// Port of simplex-noise v4 (npm) + mulberry32 PRNG from terrain-noise.js.
// Must produce identical results to the JS client for the same seed and coordinates.

// grad3 matches the Float64Array in simplex-noise v4 exactly.
// 2D dot product uses components [i*3] and [i*3+1].
var grad3 = [36]float64{
	1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0,
	1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, -1,
	0, 1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1,
}

const (
	sqrt3 = 1.7320508075688772935
	f2    = 0.5 * (sqrt3 - 1.0)
	g2    = (3.0 - sqrt3) / 6.0
)

// mulberry32 matches the JS implementation in terrain-noise.js exactly.
func newMulberry32(seed uint32) func() float64 {
	return func() float64 {
		seed += 0x6D2B79F5
		t := (seed ^ (seed >> 15)) * (1 | seed)
		t = (t + (t^(t>>7))*(61|t)) ^ t
		return float64(t^(t>>14)) / 4294967296.0
	}
}

type simplexNoise struct {
	perm      [512]uint8
	permMod12 [512]uint8
}

// newSimplexNoise matches buildPermutationTable() in simplex-noise v4.
func newSimplexNoise(seed uint32) *simplexNoise {
	rng := newMulberry32(seed)
	var p [256]uint8
	for i := range p {
		p[i] = uint8(i)
	}
	for i := 0; i < 255; i++ {
		r := i + int(rng()*float64(256-i))
		p[i], p[r] = p[r], p[i]
	}
	s := &simplexNoise{}
	for i := 0; i < 512; i++ {
		s.perm[i] = p[i&255]
		s.permMod12[i] = s.perm[i] % 12
	}
	return s
}

// noise2D matches the noise2D function in simplex-noise v4 exactly.
func (s *simplexNoise) noise2D(x, y float64) float64 {
	// Skew input space to determine which simplex cell we're in
	sc := (x + y) * f2
	i := int(math.Floor(x + sc))
	j := int(math.Floor(y + sc))

	t := float64(i+j) * g2
	x0 := x - (float64(i) - t)
	y0 := y - (float64(j) - t)

	var i1, j1 int
	if x0 > y0 {
		i1, j1 = 1, 0
	} else {
		i1, j1 = 0, 1
	}

	x1 := x0 - float64(i1) + g2
	y1 := y0 - float64(j1) + g2
	x2 := x0 - 1.0 + 2.0*g2
	y2 := y0 - 1.0 + 2.0*g2

	ii := i & 255
	jj := j & 255

	var n0, n1, n2 float64

	t0 := 0.5 - x0*x0 - y0*y0
	if t0 >= 0 {
		gi0 := int(s.permMod12[ii+int(s.perm[jj])])
		t0 *= t0
		n0 = t0 * t0 * (grad3[gi0*3]*x0 + grad3[gi0*3+1]*y0)
	}

	t1 := 0.5 - x1*x1 - y1*y1
	if t1 >= 0 {
		gi1 := int(s.permMod12[ii+i1+int(s.perm[jj+j1])])
		t1 *= t1
		n1 = t1 * t1 * (grad3[gi1*3]*x1 + grad3[gi1*3+1]*y1)
	}

	t2 := 0.5 - x2*x2 - y2*y2
	if t2 >= 0 {
		gi2 := int(s.permMod12[ii+1+int(s.perm[jj+1])])
		t2 *= t2
		n2 = t2 * t2 * (grad3[gi2*3]*x2 + grad3[gi2*3+1]*y2)
	}

	return 70.0 * (n0 + n1 + n2)
}
