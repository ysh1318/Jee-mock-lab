import { Question, Subject, Section } from "../../types";

export const QUESTIONS_2024_JAN_27_S1: Question[] = [
  // ==========================================
  // PHYSICS (Questions 1 - 30)
  // Section A: Q1 - Q20 (MCQ)
  // Section B: Q21 - Q30 (NAT, Attempt any 5 of 10 - Legacy 2024 Pattern)
  // ==========================================
  {
    id: "2024-P-01",
    subject: Subject.PHYSICS,
    section: Section.A,
    questionNumber: 1,
    questionText: "An object is placed at a distance of $12\\text{ cm}$ in front of a concave mirror of focal length $18\\text{ cm}$. The magnification produced by the mirror is:",
    options: [
      "+3",
      "-3",
      "+1.5",
      "-1.5"
    ],
    correctAnswer: "A",
    topic: "Ray Optics",
    difficulty: "Easy",
    explanation: "Magnification formula: $$m = \\frac{f}{f - u}$$.\nWith $f = -18\\text{ cm}$ and $u = -12\\text{ cm}$:\n$$m = \\frac{-18}{-18 - (-12)} = \\frac{-18}{-18 + 12} = \\frac{-18}{-6} = +3$$."
  },
  {
    id: "2024-P-02",
    subject: Subject.PHYSICS,
    section: Section.A,
    questionNumber: 2,
    questionText: "A body of mass $5\\text{ kg}$ is moving with a velocity $\\vec{v} = (3\\hat{i} + 4\\hat{j})\\text{ m/s}$. The kinetic energy of the body is:",
    options: [
      "62.5 J",
      "125 J",
      "25 J",
      "50 J"
    ],
    correctAnswer: "A",
    topic: "Work, Power and Energy",
    difficulty: "Easy",
    explanation: "$$v = |\\vec{v}| = \\sqrt{3^2 + 4^2} = 5\\text{ m/s}$$.\n$$KE = \\frac{1}{2} m v^2 = \\frac{1}{2} \\times 5 \\times 5^2 = \\frac{125}{2} = 62.5\\text{ J}$$."
  },
  {
    id: "2024-P-03",
    subject: Subject.PHYSICS,
    section: Section.A,
    questionNumber: 3,
    questionText: "The escape velocity from the surface of Earth is $v_e = 11.2\\text{ km/s}$. For another planet having twice the mass and half the radius of Earth, the escape velocity will be:",
    options: [
      "22.4 km/s",
      "11.2 km/s",
      "5.6 km/s",
      "44.8 km/s"
    ],
    correctAnswer: "A",
    topic: "Gravitation",
    difficulty: "Easy",
    explanation: "$$v_e = \\sqrt{\\frac{2GM}{R}}$$.\nFor the planet: $$v'_e = \\sqrt{\\frac{2G(2M)}{R/2}} = \\sqrt{4 \\times \\frac{2GM}{R}} = 2 v_e = 2 \\times 11.2 = 22.4\\text{ km/s}$$."
  },
  {
    id: "2024-P-04",
    subject: Subject.PHYSICS,
    section: Section.A,
    questionNumber: 4,
    questionText: "The dimensional formula of magnetic flux ($\\Phi_B$) is:",
    options: [
      "$[\\text{M}\\text{L}^2\\text{T}^{-2}\\text{A}^{-1}]$",
      "$[\\text{M}\\text{L}\\text{T}^{-2}\\text{A}^{-1}]$",
      "$[\\text{M}\\text{L}^2\\text{T}^{-1}\\text{A}^{-2}]$",
      "$[\\text{M}\\text{L}^0\\text{T}^{-2}\\text{A}^{-1}]$"
    ],
    correctAnswer: "A",
    topic: "Units and Dimensions",
    difficulty: "Easy",
    explanation: "$$\\Phi_B = B \\cdot A = \\frac{F}{I L} \\cdot L^2 = \\frac{\\text{MLT}^{-2} \\cdot \\text{L}^2}{\\text{A} \\cdot \\text{L}} = [\\text{M}\\text{L}^2\\text{T}^{-2}\\text{A}^{-1}]$$."
  },
  {
    id: "2024-P-05",
    subject: Subject.PHYSICS,
    section: Section.A,
    questionNumber: 5,
    questionText: "A particle executes SHM with equation $y = 5 \\sin(2\\pi t + \\pi/4)\\text{ cm}$. The maximum acceleration of the particle is: (Take $\\pi^2 \\approx 10$)",
    options: [
      "200 cm/s²",
      "100 cm/s²",
      "50 cm/s²",
      "400 cm/s²"
    ],
    correctAnswer: "A",
    topic: "Oscillations (SHM)",
    difficulty: "Easy",
    explanation: "$$\\omega = 2\\pi\\text{ rad/s}, \\quad A = 5\\text{ cm}$$.\n$$a_{\\text{max}} = \\omega^2 A = (2\\pi)^2 \\times 5 = 4\\pi^2 \\times 5 = 20\\pi^2 \\approx 20 \\times 10 = 200\\text{ cm/s}^2$$."
  },
  {
    id: "2024-P-06",
    subject: Subject.PHYSICS,
    section: Section.A,
    questionNumber: 6,
    questionText: "The ratio of root mean square velocity to most probable velocity of molecules of an ideal gas at temperature $T$ is:",
    options: [
      "$\\sqrt{3} : \\sqrt{2}$",
      "$\\sqrt{2} : \\sqrt{3}$",
      "$3 : 2$",
      "$\\sqrt{8} : \\sqrt{3\\pi}$"
    ],
    correctAnswer: "A",
    topic: "Kinetic Theory of Gases",
    difficulty: "Easy",
    explanation: "$$v_{\\text{rms}} = \\sqrt{\\frac{3RT}{M}}, \\quad v_{\\text{mp}} = \\sqrt{\\frac{2RT}{M}}$$.\nRatio $$\\frac{v_{\\text{rms}}}{v_{\\text{mp}}} = \\frac{\\sqrt{3}}{\\sqrt{2}}$$, so $\\sqrt{3} : \\sqrt{2}$."
  },
  {
    id: "2024-P-07",
    subject: Subject.PHYSICS,
    section: Section.A,
    questionNumber: 7,
    questionText: "Two resistors $R_1 = (100 \\pm 3)\\,\\Omega$ and $R_2 = (200 \\pm 4)\\,\\Omega$ are connected in series. The equivalent resistance with error limit is:",
    options: [
      "$(300 \\pm 7)\\,\\Omega$",
      "$(300 \\pm 1)\\,\\Omega$",
      "$(300 \\pm 3.5)\\,\\Omega$",
      "$(300 \\pm 12)\\,\\Omega$"
    ],
    correctAnswer: "A",
    topic: "Units and Dimensions",
    difficulty: "Easy",
    explanation: "In series: $$R_{\\text{eq}} = R_1 + R_2 = 100 + 200 = 300\\,\\Omega$$.\nAbsolute error adds up: $$\\Delta R = \\Delta R_1 + \\Delta R_2 = 3 + 4 = 7\\,\\Omega$$.\nHence $R_{\\text{eq}} = (300 \\pm 7)\\,\\Omega$."
  },
  {
    id: "2024-P-08",
    subject: Subject.PHYSICS,
    section: Section.A,
    questionNumber: 8,
    questionText: "In a half-wave rectifier, if the input AC mains frequency is $50\\text{ Hz}$, the ripple frequency of output rectified DC is:",
    options: [
      "50 Hz",
      "100 Hz",
      "25 Hz",
      "0 Hz"
    ],
    correctAnswer: "A",
    topic: "Semiconductors",
    difficulty: "Easy",
    explanation: "For a half-wave rectifier, the output frequency equals the input frequency ($50\\text{ Hz}$). For a full-wave rectifier, it is $2f = 100\\text{ Hz}$."
  },
  {
    id: "2024-P-09",
    subject: Subject.PHYSICS,
    section: Section.A,
    questionNumber: 9,
    questionText: "A projectile is thrown with speed $u = 20\\text{ m/s}$ at an angle of $30^\\circ$ with the horizontal. The maximum height reached is: (Take $g = 10\\text{ m/s}^2$)",
    options: [
      "5.0 m",
      "10.0 m",
      "15.0 m",
      "20.0 m"
    ],
    correctAnswer: "A",
    topic: "Motion in a Plane",
    difficulty: "Easy",
    explanation: "$$H = \\frac{u^2 \\sin^2\\theta}{2g} = \\frac{(20)^2 \\sin^2(30^\\circ)}{2 \\times 10} = \\frac{400 \\times (1/4)}{20} = \\frac{100}{20} = 5.0\\text{ m}$$."
  },
  {
    id: "2024-P-10",
    subject: Subject.PHYSICS,
    section: Section.A,
    questionNumber: 10,
    questionText: "If the radius of a circular coil carrying current is doubled while the current is halved, its magnetic dipole moment:",
    options: [
      "Doubles",
      "Halves",
      "Remains constant",
      "Quadruples"
    ],
    correctAnswer: "A",
    topic: "Magnetism & Magnetic Fields",
    difficulty: "Easy",
    explanation: "Magnetic moment $M = I A = I(\\pi R^2)$.\nNew moment: $$M' = \\left(\\frac{I}{2}\\right) \\pi (2R)^2 = \\frac{I}{2} \\pi (4R^2) = 2 I \\pi R^2 = 2M$$.\nHence it doubles."
  },
  {
    id: "2024-P-11",
    subject: Subject.PHYSICS,
    section: Section.A,
    questionNumber: 11,
    questionText: "The threshold frequency for a photosensitive metal surface is $\\nu_0$. When light of frequency $2\\nu_0$ is incident, the maximum kinetic energy of emitted photoelectrons is $K_1$. When light of frequency $5\\nu_0$ is incident, the maximum kinetic energy is $K_2$. The ratio $K_1 / K_2$ is:",
    options: [
      "1/4",
      "2/5",
      "1/3",
      "1/5"
    ],
    correctAnswer: "A",
    topic: "Dual Nature of Matter & Radiation",
    difficulty: "Easy",
    explanation: "$$K_1 = h(2\\nu_0) - h\\nu_0 = h\\nu_0$$.\n$$K_2 = h(5\\nu_0) - h\\nu_0 = 4h\\nu_0$$.\nRatio $$\\frac{K_1}{K_2} = \\frac{h\\nu_0}{4h\\nu_0} = \\frac{1}{4}$$."
  },
  {
    id: "2024-P-12",
    subject: Subject.PHYSICS,
    section: Section.A,
    questionNumber: 12,
    questionText: "A circular disc of radius $R$ and mass $M$ rolls without slipping on a horizontal surface with linear speed $v$. The ratio of its rotational kinetic energy to its total kinetic energy is:",
    options: [
      "1/3",
      "1/2",
      "2/3",
      "1/4"
    ],
    correctAnswer: "A",
    topic: "Rotational Dynamics",
    difficulty: "Easy",
    explanation: "For a disc: $I = \\frac{1}{2} M R^2$. $v = \\omega R$.\n$$K_{\\text{rot}} = \\frac{1}{2} I \\omega^2 = \\frac{1}{4} M v^2$$.\n$$K_{\\text{trans}} = \\frac{1}{2} M v^2$$.\n$$K_{\\text{tot}} = \\frac{1}{4} M v^2 + \\frac{1}{2} M v^2 = \\frac{3}{4} M v^2$$.\n$$\\frac{K_{\\text{rot}}}{K_{\\text{tot}}} = \\frac{1/4}{3/4} = \\frac{1}{3}$$."
  },
  {
    id: "2024-P-13",
    subject: Subject.PHYSICS,
    section: Section.A,
    questionNumber: 13,
    questionText: "In an LCR series circuit, resonance occurs at frequency $f_0$. If inductance is made 4 times and capacitance is made 4 times, the new resonant frequency will be:",
    options: [
      "$f_0 / 4$",
      "$f_0 / 2$",
      "$2 f_0$",
      "$4 f_0$"
    ],
    correctAnswer: "A",
    topic: "Alternating Current",
    difficulty: "Easy",
    explanation: "$$f_0 = \\frac{1}{2\\pi \\sqrt{LC}}$$.\nWhen $L' = 4L, C' = 4C$, $$f' = \\frac{1}{2\\pi \\sqrt{(4L)(4C)}} = \\frac{1}{2\\pi \\cdot 4 \\sqrt{LC}} = \\frac{f_0}{4}$$."
  },
  {
    id: "2024-P-14",
    subject: Subject.PHYSICS,
    section: Section.A,
    questionNumber: 14,
    questionText: "A capillary tube of radius $r$ is immersed in water and water rises to a height $h$. If another capillary tube of radius $2r$ is immersed in the same water, the height of water column will be:",
    options: [
      "$h/2$",
      "$2h$",
      "$h/4$",
      "$4h$"
    ],
    correctAnswer: "A",
    topic: "Properties of Matter",
    difficulty: "Easy",
    explanation: "Jurin's law: $$h = \\frac{2T\\cos\\theta}{\\rho g r} \\implies h \\propto \\frac{1}{r}$$.\nWhen radius is doubled, height is halved ($h/2$)."
  },
  {
    id: "2024-P-15",
    subject: Subject.PHYSICS,
    section: Section.A,
    questionNumber: 15,
    questionText: "An electric dipole of dipole moment $p = 4 \\times 10^{-9}\\text{ C}\\cdot\\text{m}$ is placed in a uniform electric field $E = 5 \\times 10^4\\text{ N/C}$ at an angle of $30^\\circ$ to the field. The torque experienced by the dipole is:",
    options: [
      "$1.0 \\times 10^{-4}\\text{ N}\\cdot\\text{m}$",
      "$2.0 \\times 10^{-4}\\text{ N}\\cdot\\text{m}$",
      "$1.73 \\times 10^{-4}\\text{ N}\\cdot\\text{m}$",
      "$0.5 \\times 10^{-4}\\text{ N}\\cdot\\text{m}$"
    ],
    correctAnswer: "A",
    topic: "Electrostatics",
    difficulty: "Easy",
    explanation: "$$\\tau = p E \\sin\\theta = (4 \\times 10^{-9}) \\times (5 \\times 10^4) \\times \\sin(30^\\circ) = 20 \\times 10^{-5} \\times 0.5 = 1.0 \\times 10^{-4}\\text{ N}\\cdot\\text{m}$$."
  },
  {
    id: "2024-P-16",
    subject: Subject.PHYSICS,
    section: Section.A,
    questionNumber: 16,
    questionText: "The binding energy per nucleon of nucleus $A$ is $7.6\\text{ MeV}$ and that of nucleus $B$ is $8.4\\text{ MeV}$. This implies that:",
    options: [
      "Nucleus B is more stable than nucleus A",
      "Nucleus A is more stable than nucleus B",
      "Both nuclei have identical stability",
      "Nucleus B undergoes spontaneous fission"
    ],
    correctAnswer: "A",
    topic: "Nuclear Physics",
    difficulty: "Easy",
    explanation: "Higher binding energy per nucleon signifies greater stability of the nuclear configuration."
  },
  {
    id: "2024-P-17",
    subject: Subject.PHYSICS,
    section: Section.A,
    questionNumber: 17,
    questionText: "A car is negotiating a curved level road of radius $R = 100\\text{ m}$. If the coefficient of static friction is $\\mu_s = 0.4$, the maximum safe speed without skidding is: (Take $g = 10\\text{ m/s}^2$)",
    options: [
      "20 m/s",
      "10 m/s",
      "40 m/s",
      "14.1 m/s"
    ],
    correctAnswer: "A",
    topic: "Laws of Motion",
    difficulty: "Easy",
    explanation: "$$v_{\\text{max}} = \\sqrt{\\mu_s g R} = \\sqrt{0.4 \\times 10 \\times 100} = \\sqrt{400} = 20\\text{ m/s}$$."
  },
  {
    id: "2024-P-18",
    subject: Subject.PHYSICS,
    section: Section.A,
    questionNumber: 18,
    questionText: "The electric potential in a region of space is given by $V(x, y, z) = 4x^2\\text{ V}$. The electric field at point $(1\\text{ m}, 0, 2\\text{ m})$ is:",
    options: [
      "$-8\\hat{i}\\text{ V/m}$",
      "$+8\\hat{i}\\text{ V/m}$",
      "$-4\\hat{i}\\text{ V/m}$",
      "$-8\\hat{k}\\text{ V/m}$"
    ],
    correctAnswer: "A",
    topic: "Electrostatics",
    difficulty: "Easy",
    explanation: "$$E_x = -\\frac{\\partial V}{\\partial x} = -\\frac{d}{dx}(4x^2) = -8x$$.\nAt $x = 1\\text{ m}$, $E_x = -8\\text{ V/m}$, and $E_y = E_z = 0$. Hence $\\vec{E} = -8\\hat{i}\\text{ V/m}$."
  },
  {
    id: "2024-P-19",
    subject: Subject.PHYSICS,
    section: Section.A,
    questionNumber: 19,
    questionText: "A wire of length $L$ carries current $I$. It is first bent into a circular loop of 1 turn, and then into a circular loop of 2 turns. The ratio of magnetic field at the center in the two cases is:",
    options: [
      "1 : 4",
      "1 : 2",
      "4 : 1",
      "2 : 1"
    ],
    correctAnswer: "A",
    topic: "Magnetism & Magnetic Fields",
    difficulty: "Easy",
    explanation: "For 1 turn: $R_1 = \\frac{L}{2\\pi}$, $$B_1 = \\frac{\\mu_0 I}{2 R_1} = \\frac{\\mu_0 I \\pi}{L}$$.\nFor 2 turns: $R_2 = \\frac{L}{4\\pi}$, $$B_2 = 2 \\times \\frac{\\mu_0 I}{2 R_2} = 2 \\times \\frac{\\mu_0 I (4\\pi)}{2L} = 4 \\times \\frac{\\mu_0 I \\pi}{L} = 4 B_1$$.\nRatio $B_1 / B_2 = 1 : 4$."
  },
  {
    id: "2024-P-20",
    subject: Subject.PHYSICS,
    section: Section.A,
    questionNumber: 20,
    questionText: "A transformer has 500 primary turns and 50 secondary turns. If the input voltage is $220\\text{ V AC}$, the output voltage is:",
    options: [
      "22 V",
      "2200 V",
      "44 V",
      "11 V"
    ],
    correctAnswer: "A",
    topic: "Alternating Current",
    difficulty: "Easy",
    explanation: "$$\\frac{V_s}{V_p} = \\frac{N_s}{N_p} \\implies V_s = 220 \\times \\frac{50}{500} = 220 \\times \\frac{1}{10} = 22\\text{ V}$$."
  },

  // Physics Section B (NAT - Q21 to Q30, Attempt Any 5)
  {
    id: "2024-P-21",
    subject: Subject.PHYSICS,
    section: Section.B,
    questionNumber: 21,
    questionText: "A stone is dropped into a well of depth $d = 80\\text{ m}$. The time elapsed before hearing the splash is $t$ seconds. If speed of sound in air is $320\\text{ m/s}$ and $g = 10\\text{ m/s}^2$, then $t = $ _____ s.",
    correctAnswer: "4.25",
    topic: "Kinematics",
    difficulty: "Easy",
    explanation: "Time to fall: $$t_1 = \\sqrt{\\frac{2d}{g}} = \\sqrt{\\frac{160}{10}} = 4.0\\text{ s}$$.\nTime for sound to travel up: $$t_2 = \\frac{d}{v_{\\text{sound}}} = \\frac{80}{320} = 0.25\\text{ s}$$.\nTotal time $t = 4.0 + 0.25 = 4.25\\text{ s}$."
  },
  {
    id: "2024-P-22",
    subject: Subject.PHYSICS,
    section: Section.B,
    questionNumber: 22,
    questionText: "A spherical black body of radius $R = 10\\text{ cm}$ radiates power $450\\text{ W}$ at temperature $500\\text{ K}$. If the radius were halved and temperature doubled, the power radiated would be _____ W.",
    correctAnswer: "1800",
    topic: "Thermal Properties of Matter",
    difficulty: "Easy",
    explanation: "Stefan's Law: $$P = \\sigma A T^4 = \\sigma (4\\pi R^2) T^4 \\implies P \\propto R^2 T^4$$.\n$$P' = P \\left(\\frac{R'}{R}\\right)^2 \\left(\\frac{T'}{T}\\right)^4 = 450 \\times \\left(\\frac{1}{2}\\right)^2 \\times (2)^4 = 450 \\times \\frac{1}{4} \\times 16 = 450 \\times 4 = 1800\\text{ W}$$."
  },
  {
    id: "2024-P-23",
    subject: Subject.PHYSICS,
    section: Section.B,
    questionNumber: 23,
    questionText: "Three capacitors of capacitances $2\\,\\mu\\text{F}, 3\\,\\mu\\text{F}$, and $6\\,\\mu\\text{F}$ are connected in series. The equivalent capacitance of this combination is _____ $\\mu\\text{F}$.",
    correctAnswer: "1",
    topic: "Capacitance",
    difficulty: "Easy",
    explanation: "$$\\frac{1}{C_{\\text{eq}}} = \\frac{1}{2} + \\frac{1}{3} + \\frac{1}{6} = \\frac{3 + 2 + 1}{6} = \\frac{6}{6} = 1 \\implies C_{\\text{eq}} = 1\\,\\mu\\text{F}$$."
  },
  {
    id: "2024-P-24",
    subject: Subject.PHYSICS,
    section: Section.B,
    questionNumber: 24,
    questionText: "In a Young's double slit experiment using light of $\\lambda = 500\\text{ nm}$, the slit separation is $d = 1\\text{ mm}$ and screen distance is $D = 1\\text{ m}$. The fringe width is _____ mm.",
    correctAnswer: "0.5",
    topic: "Wave Optics",
    difficulty: "Easy",
    explanation: "$$\\beta = \\frac{\\lambda D}{d} = \\frac{(500 \\times 10^{-9})(1.0)}{1 \\times 10^{-3}} = 5 \\times 10^{-4}\\text{ m} = 0.5\\text{ mm}$$."
  },
  {
    id: "2024-P-25",
    subject: Subject.PHYSICS,
    section: Section.B,
    questionNumber: 25,
    questionText: "An electron is accelerated through a potential difference of $V = 100\\text{ V}$. Its final kinetic energy is _____ eV.",
    correctAnswer: "100",
    topic: "Dual Nature of Matter & Radiation",
    difficulty: "Easy",
    explanation: "$$KE = q V = 1e \\times 100\\text{ V} = 100\\text{ eV}$$."
  },
  {
    id: "2024-P-26",
    subject: Subject.PHYSICS,
    section: Section.B,
    questionNumber: 26,
    questionText: "A resistance of $4\\,\\Omega$ is connected across a cell of EMF $2\\text{ V}$ and internal resistance $1\\,\\Omega$. The terminal potential difference across the cell is _____ V.",
    correctAnswer: "1.6",
    topic: "Current Electricity",
    difficulty: "Easy",
    explanation: "$$I = \\frac{E}{R + r} = \\frac{2}{4 + 1} = 0.4\\text{ A}$$.\nTerminal voltage $$V = I R = 0.4 \\times 4 = 1.6\\text{ V}$$."
  },
  {
    id: "2024-P-27",
    subject: Subject.PHYSICS,
    section: Section.B,
    questionNumber: 27,
    questionText: "A solid sphere of mass $2\\text{ kg}$ and radius $0.5\\text{ m}$ is rotating about an axis passing through its center. Its moment of inertia is _____ $\\text{kg}\\cdot\\text{m}^2$.",
    correctAnswer: "0.2",
    topic: "Rotational Dynamics",
    difficulty: "Easy",
    explanation: "$$I = \\frac{2}{5} M R^2 = \\frac{2}{5} \\times 2 \\times (0.5)^2 = \\frac{4}{5} \\times 0.25 = 0.2\\text{ kg}\\cdot\\text{m}^2$$."
  },
  {
    id: "2024-P-28",
    subject: Subject.PHYSICS,
    section: Section.B,
    questionNumber: 28,
    questionText: "The de Broglie wavelength of an $\\alpha$-particle ($m = 4\\text{ amu}, q = 2e$) accelerated through potential difference $V$ is $\\lambda$. For a proton ($m = 1\\text{ amu}, q = 1e$) accelerated through the same potential, the ratio $\\lambda_p / \\lambda_\\alpha$ is $\\sqrt{k}$. The value of integer $k$ is _____.",
    correctAnswer: "8",
    topic: "Dual Nature of Matter & Radiation",
    difficulty: "Easy",
    explanation: "$$\\lambda = \\frac{h}{\\sqrt{2mqV}} \\implies \\frac{\\lambda_p}{\\lambda_\\alpha} = \\sqrt{\\frac{m_\\alpha q_\\alpha}{m_p q_p}} = \\sqrt{\\frac{4 \\times 2}{1 \\times 1}} = \\sqrt{8}$$.\nHence $k = 8$."
  },
  {
    id: "2024-P-29",
    subject: Subject.PHYSICS,
    section: Section.B,
    questionNumber: 29,
    questionText: "A body of mass $10\\text{ kg}$ is lifted vertically upward through height $h = 5\\text{ m}$ at constant speed. The work done by gravitational force is _____ J. (Take $g = 9.8\\text{ m/s}^2$)",
    correctAnswer: "-490",
    topic: "Work, Power and Energy",
    difficulty: "Easy",
    explanation: "$$W_g = -mgh = -10 \\times 9.8 \\times 5 = -490\\text{ J}$$."
  },
  {
    id: "2024-P-30",
    subject: Subject.PHYSICS,
    section: Section.B,
    questionNumber: 30,
    questionText: "The magnetic field at a distance of $5\\text{ cm}$ from a long straight wire carrying $10\\text{ A}$ current is $B\\,\\mu\\text{T}$. The value of $B$ is _____ $\\mu\\text{T}$. (Take $\\mu_0 = 4\\pi \\times 10^{-7}\\text{ T}\\cdot\\text{m/A}$)",
    correctAnswer: "40",
    topic: "Magnetism & Magnetic Fields",
    difficulty: "Easy",
    explanation: "$$B = \\frac{\\mu_0 I}{2\\pi r} = \\frac{(4\\pi \\times 10^{-7})(10)}{2\\pi (0.05)} = \\frac{2 \\times 10^{-6}}{0.05} = 40 \\times 10^{-6}\\text{ T} = 40\\,\\mu\\text{T}$$."
  },

  // ==========================================
  // CHEMISTRY (Questions 31 - 60)
  // Section A: Q31 - Q50 (MCQ)
  // Section B: Q51 - Q60 (NAT, Attempt any 5 of 10 - Legacy 2024 Pattern)
  // ==========================================
  {
    id: "2024-C-31",
    subject: Subject.CHEMISTRY,
    section: Section.A,
    questionNumber: 31,
    questionText: "The correct electronic configuration of Chromium atom (atomic number 24) in ground state is:",
    options: [
      "$[\\text{Ar}] 3d^5 4s^1$",
      "$[\\text{Ar}] 3d^4 4s^2$",
      "$[\\text{Ar}] 3d^6 4s^0$",
      "$[\\text{Ar}] 3d^3 4s^2 4p^1$"
    ],
    correctAnswer: "A",
    topic: "Atomic Structure",
    difficulty: "Easy",
    explanation: "Due to extra stability associated with half-filled $d^5$ subshell, an electron is promoted from $4s$ to $3d$, yielding $[\\text{Ar}] 3d^5 4s^1$."
  },
  {
    id: "2024-C-32",
    subject: Subject.CHEMISTRY,
    section: Section.A,
    questionNumber: 32,
    questionText: "Which of the following compounds has maximum dipole moment?",
    options: [
      "$\\text{NH}_3$",
      "$\\text{NF}_3$",
      "$\\text{BF}_3$",
      "$\\text{CCl}_4$"
    ],
    correctAnswer: "A",
    topic: "Chemical Bonding",
    difficulty: "Easy",
    explanation: "In $\\text{NH}_3$, the dipole moments of the three $\\text{N-H}$ bonds and lone pair point in the same direction, reinforcing each other ($\\mu = 1.47\\text{ D}$). In $\\text{NF}_3$, fluorines oppose the lone pair."
  },
  {
    id: "2024-C-33",
    subject: Subject.CHEMISTRY,
    section: Section.A,
    questionNumber: 33,
    questionText: "The oxidation states of phosphorus in $\\text{H}_3\\text{PO}_2$, $\\text{H}_3\\text{PO}_3$, and $\\text{H}_3\\text{PO}_4$ are respectively:",
    options: [
      "+1, +3, +5",
      "+1, +5, +3",
      "+3, +1, +5",
      "+5, +3, +1"
    ],
    correctAnswer: "A",
    topic: "p-Block Elements",
    difficulty: "Easy",
    explanation: "In $\\text{H}_3\\text{PO}_2$: $3(+1) + x + 2(-2) = 0 \\implies x = +1$.\nIn $\\text{H}_3\\text{PO}_3$: $3(+1) + x + 3(-2) = 0 \\implies x = +3$.\nIn $\\text{H}_3\\text{PO}_4$: $3(+1) + x + 4(-2) = 0 \\implies x = +5$."
  },
  {
    id: "2024-C-34",
    subject: Subject.CHEMISTRY,
    section: Section.A,
    questionNumber: 34,
    questionText: "Which noble gas is most soluble in water?",
    options: [
      "Xenon (Xe)",
      "Helium (He)",
      "Neon (Ne)",
      "Argon (Ar)"
    ],
    correctAnswer: "A",
    topic: "p-Block Elements",
    difficulty: "Easy",
    explanation: "Solubility of noble gases increases down the group due to increased polarisability and stronger dipole-induced dipole interactions with water molecules."
  },
  {
    id: "2024-C-35",
    subject: Subject.CHEMISTRY,
    section: Section.A,
    questionNumber: 35,
    questionText: "Lucas test is used to distinguish between primary, secondary, and tertiary alcohols. The reagent used is:",
    options: [
      "Anhydrous $\\text{ZnCl}_2 + \\text{conc. }\\text{HCl}$",
      "$\\text{Cu} / 573\\text{ K}$",
      "$\\text{KMnO}_4 + \\text{KOH}$",
      "$\\text{CrO}_3 + \\text{pyridine}$"
    ],
    correctAnswer: "A",
    topic: "Alcohols, Phenols and Ethers",
    difficulty: "Easy",
    explanation: "Lucas reagent is an equimolar mixture of anhydrous $\\text{ZnCl}_2$ and concentrated $\\text{HCl}$."
  },
  {
    id: "2024-C-36",
    subject: Subject.CHEMISTRY,
    section: Section.A,
    questionNumber: 36,
    questionText: "The IUPAC name of $\\text{CH}_3-\\text{C}(\\text{CH}_3)_2-\\text{CH}_2-\\text{CH}_3$ is:",
    options: [
      "2,2-Dimethylbutane",
      "2-Ethyl-2-methylpropane",
      "3,3-Dimethylbutane",
      "Neohexane"
    ],
    correctAnswer: "A",
    topic: "General Organic Chemistry",
    difficulty: "Easy",
    explanation: "Longest continuous carbon chain has 4 carbons (butane) with two methyl substituents at carbon-2: 2,2-dimethylbutane."
  },
  {
    id: "2024-C-37",
    subject: Subject.CHEMISTRY,
    section: Section.A,
    questionNumber: 37,
    questionText: "The coordination number and oxidation state of cobalt in $[\\text{Co}(\\text{en})_3]^{3+}$ are respectively:",
    options: [
      "6 and +3",
      "3 and +3",
      "6 and +2",
      "4 and +3"
    ],
    correctAnswer: "A",
    topic: "Coordination Compounds",
    difficulty: "Easy",
    explanation: "Ethylenediamine (en) is a bidentate neutral ligand. Three bidentate ligands donate $3 \\times 2 = 6$ coordinate bonds (coordination number 6). Oxidation state is $+3$."
  },
  {
    id: "2024-C-38",
    subject: Subject.CHEMISTRY,
    section: Section.A,
    questionNumber: 38,
    questionText: "Which of the following compounds does NOT give Fehling's test?",
    options: [
      "Benzaldehyde",
      "Acetaldehyde",
      "Formaldehyde",
      "Glucose"
    ],
    correctAnswer: "A",
    topic: "Aldehydes and Ketones",
    difficulty: "Easy",
    explanation: "Aromatic aldehydes such as benzaldehyde do not reduce Fehling's solution due to lack of reducing power compared to aliphatic aldehydes."
  },
  {
    id: "2024-C-39",
    subject: Subject.CHEMISTRY,
    section: Section.A,
    questionNumber: 39,
    questionText: "For an ideal solution, which of the following thermodynamic relations is correct?",
    options: [
      "$\\Delta H_{\\text{mix}} = 0$ and $\\Delta V_{\\text{mix}} = 0$",
      "$\\Delta H_{\\text{mix}} > 0$ and $\\Delta V_{\\text{mix}} > 0$",
      "$\\Delta H_{\\text{mix}} < 0$ and $\\Delta V_{\\text{mix}} < 0$",
      "$\\Delta S_{\\text{mix}} = 0$"
    ],
    correctAnswer: "A",
    topic: "Solutions",
    difficulty: "Easy",
    explanation: "For an ideal solution obeying Raoult's law at all concentrations, $\\Delta H_{\\text{mix}} = 0$, $\\Delta V_{\\text{mix}} = 0$, while $\\Delta S_{\\text{mix}} > 0$."
  },
  {
    id: "2024-C-40",
    subject: Subject.CHEMISTRY,
    section: Section.A,
    questionNumber: 40,
    questionText: "The major product of reaction of propene with $\\text{HBr}$ in the presence of benzoyl peroxide is:",
    options: [
      "1-Bromopropane",
      "2-Bromopropane",
      "1,2-Dibromopropane",
      "2-Bromopropene"
    ],
    correctAnswer: "A",
    topic: "Hydrocarbons",
    difficulty: "Easy",
    explanation: "In the presence of organic peroxides, addition of $\\text{HBr}$ to unsymmetrical alkenes follows the Kharasch (anti-Markovnikov) free radical mechanism to yield 1-bromopropane."
  },
  {
    id: "2024-C-41",
    subject: Subject.CHEMISTRY,
    section: Section.A,
    questionNumber: 41,
    questionText: "The units of rate constant for a zero order reaction are:",
    options: [
      "$\\text{mol}\\cdot\\text{L}^{-1}\\cdot\\text{s}^{-1}$",
      "$\\text{s}^{-1}$",
      "$\\text{L}\\cdot\\text{mol}^{-1}\\cdot\\text{s}^{-1}$",
      "$\\text{L}^2\\cdot\\text{mol}^{-2}\\cdot\\text{s}^{-1}$"
    ],
    correctAnswer: "A",
    topic: "Chemical Kinetics",
    difficulty: "Easy",
    explanation: "Rate $= k [A]^0 = k$. Hence unit of $k$ is identical to unit of reaction rate: $\\text{mol}\\cdot\\text{L}^{-1}\\cdot\\text{s}^{-1}$."
  },
  {
    id: "2024-C-42",
    subject: Subject.CHEMISTRY,
    section: Section.A,
    questionNumber: 42,
    questionText: "Which of the following is an amphoteric oxide?",
    options: [
      "$\\text{Al}_2\\text{O}_3$",
      "$\\text{Na}_2\\text{O}$",
      "$\\text{SO}_3$",
      "$\\text{CaO}$"
    ],
    correctAnswer: "A",
    topic: "Periodic Table & Periodicity",
    difficulty: "Easy",
    explanation: "$\\text{Al}_2\\text{O}_3$ reacts with both acids (forming aluminum salts) and strong bases (forming aluminate ions), displaying amphoteric behavior."
  },
  {
    id: "2024-C-43",
    subject: Subject.CHEMISTRY,
    section: Section.A,
    questionNumber: 43,
    questionText: "Which of the following vitamins is water-soluble?",
    options: [
      "Vitamin C",
      "Vitamin A",
      "Vitamin D",
      "Vitamin K"
    ],
    correctAnswer: "A",
    topic: "Biomolecules",
    difficulty: "Easy",
    explanation: "Vitamins B and C are water-soluble vitamins, whereas Vitamins A, D, E, and K are fat-soluble."
  },
  {
    id: "2024-C-44",
    subject: Subject.CHEMISTRY,
    section: Section.A,
    questionNumber: 44,
    questionText: "In the reaction $\\text{CH}_3\\text{CONH}_2 + \\text{Br}_2 + 4\\text{KOH} \\to \\text{CH}_3\\text{NH}_2 + \\text{K}_2\\text{CO}_3 + 2\\text{KBr} + 2\\text{H}_2\\text{O}$, the name of the reaction is:",
    options: [
      "Hoffmann bromamide degradation",
      "Gabriel phthalimide synthesis",
      "Carbylamine reaction",
      "Wurtz reaction"
    ],
    correctAnswer: "A",
    topic: "Amines",
    difficulty: "Easy",
    explanation: "Conversion of primary amides to primary amines with one less carbon atom using $\\text{Br}_2$ and alkali is the Hoffmann bromamide reaction."
  },
  {
    id: "2024-C-45",
    subject: Subject.CHEMISTRY,
    section: Section.A,
    questionNumber: 45,
    questionText: "The correct stability order of carbocations is:",
    options: [
      "$(CH_3)_3C^+ > (CH_3)_2CH^+ > CH_3CH_2^+ > CH_3^+$",
      "$CH_3^+ > CH_3CH_2^+ > (CH_3)_2CH^+ > (CH_3)_3C^+$",
      "$(CH_3)_2CH^+ > (CH_3)_3C^+ > CH_3CH_2^+ > CH_3^+$",
      "$(CH_3)_3C^+ > CH_3CH_2^+ > (CH_3)_2CH^+ > CH_3^+$"
    ],
    correctAnswer: "A",
    topic: "General Organic Chemistry",
    difficulty: "Easy",
    explanation: "Stability increases with more hyperconjugative structures (number of $\\alpha$-hydrogens: $9 > 6 > 3 > 0$) and $+I$ inductive effect."
  },
  {
    id: "2024-C-46",
    subject: Subject.CHEMISTRY,
    section: Section.A,
    questionNumber: 46,
    questionText: "Which of the following compounds has square planar geometry?",
    options: [
      "$[\\text{PtCl}_4]^{2-}$",
      "$[\\text{NiCl}_4]^{2-}$",
      "$\\text{CH}_4$",
      "$\\text{NH}_4^+$"
    ],
    correctAnswer: "A",
    topic: "Coordination Compounds",
    difficulty: "Easy",
    explanation: "$\\text{Pt}^{2+}$ is a $5d^8$ metal ion. Complexes of $4d$ and $5d$ transition series with coordination number 4 are almost invariably square planar ($dsp^2$) irrespective of ligand strength."
  },
  {
    id: "2024-C-47",
    subject: Subject.CHEMISTRY,
    section: Section.A,
    questionNumber: 47,
    questionText: "The rate of effusion of gas $A$ is 2 times that of gas $B$. The ratio of their molar masses $M_B / M_A$ is:",
    options: [
      "4",
      "2",
      "1/2",
      "1/4"
    ],
    correctAnswer: "A",
    topic: "States of Matter",
    difficulty: "Easy",
    explanation: "Graham's Law: $$\\frac{r_A}{r_B} = \\sqrt{\\frac{M_B}{M_A}} = 2 \\implies \\frac{M_B}{M_A} = 2^2 = 4$$."
  },
  {
    id: "2024-C-48",
    subject: Subject.CHEMISTRY,
    section: Section.A,
    questionNumber: 48,
    questionText: "The molar conductivity of an electrolyte increases with dilution because:",
    options: [
      "Total volume of solution increases and ion mobility increases",
      "Degree of dissociation decreases",
      "Interionic attractions increase",
      "Number of ions per unit volume increases"
    ],
    correctAnswer: "A",
    topic: "Electrochemistry",
    difficulty: "Easy",
    explanation: "Molar conductivity $\\Lambda_m = \\kappa \\times V$. Upon dilution, the increase in volume containing one mole of electrolyte is far greater than decrease in specific conductance $\\kappa$."
  },
  {
    id: "2024-C-49",
    subject: Subject.CHEMISTRY,
    section: Section.A,
    questionNumber: 49,
    questionText: "Which of the following is an intensive property?",
    options: [
      "Density",
      "Mass",
      "Volume",
      "Enthalpy"
    ],
    correctAnswer: "A",
    topic: "Chemical Thermodynamics",
    difficulty: "Easy",
    explanation: "An intensive property does not depend on the quantity of matter present. Density is a ratio of two extensive properties (mass/volume) and is therefore intensive."
  },
  {
    id: "2024-C-50",
    subject: Subject.CHEMISTRY,
    section: Section.A,
    questionNumber: 50,
    questionText: "In the Kjeldahl method for estimation of nitrogen, nitrogen present in organic compound is quantitatively converted to:",
    options: [
      "$(\\text{NH}_4)_2\\text{SO}_4$",
      "$\\text{NH}_4\\text{Cl}$",
      "$\\text{NO}_2$",
      "$\\text{NH}_3\\text{ gas directly}$"
    ],
    correctAnswer: "A",
    topic: "General Organic Chemistry",
    difficulty: "Easy",
    explanation: "Heating the organic compound with concentrated $\\text{H}_2\\text{SO}_4$ in the presence of $\\text{CuSO}_4$ converts nitrogen into ammonium sulfate $(\\text{NH}_4)_2\\text{SO}_4$."
  },

  // Chemistry Section B (NAT - Q51 to Q60, Attempt Any 5)
  {
    id: "2024-C-51",
    subject: Subject.CHEMISTRY,
    section: Section.B,
    questionNumber: 51,
    questionText: "The number of unpaired electrons in gaseous $\\text{Fe}^{2+}$ ion (atomic number of Fe = 26) is _____.",
    correctAnswer: "4",
    topic: "d and f Block Elements",
    difficulty: "Easy",
    explanation: "$\\text{Fe}: [\\text{Ar}] 3d^6 4s^2 \\implies \\text{Fe}^{2+}: [\\text{Ar}] 3d^6$. Number of unpaired electrons in $3d^6 = 4$."
  },
  {
    id: "2024-C-52",
    subject: Subject.CHEMISTRY,
    section: Section.B,
    questionNumber: 52,
    questionText: "How many Faraday of electricity are required to deposit $1\\text{ mole}$ of aluminum from molten $\\text{Al}_2\\text{O}_3$?",
    correctAnswer: "3",
    topic: "Electrochemistry",
    difficulty: "Easy",
    explanation: "Reduction: $\\text{Al}^{3+} + 3e^- \\to \\text{Al}$. 1 mole of Al requires 3 moles of electrons $= 3\\text{ Faraday}$."
  },
  {
    id: "2024-C-53",
    subject: Subject.CHEMISTRY,
    section: Section.B,
    questionNumber: 53,
    questionText: "The bond order of $\\text{O}_2^+$ ion according to Molecular Orbital Theory is _____.",
    correctAnswer: "2.5",
    topic: "Chemical Bonding",
    difficulty: "Easy",
    explanation: "$\\text{O}_2^+$ has 15 electrons. Configuration: $\\sigma_{1s}^2 \\sigma_{1s}^{*2} \\sigma_{2s}^2 \\sigma_{2s}^{*2} \\sigma_{2p_z}^2 \\pi_{2p_x}^2 = \\pi_{2p_y}^2 \\pi_{2p_x}^{*1}$.\nBond order $= \\frac{10 - 5}{2} = 2.5$."
  },
  {
    id: "2024-C-54",
    subject: Subject.CHEMISTRY,
    section: Section.B,
    questionNumber: 54,
    questionText: "The number of chiral carbons present in an open chain $\\text{D-glucose}$ molecule is _____.",
    correctAnswer: "4",
    topic: "Biomolecules",
    difficulty: "Easy",
    explanation: "In D-glucose $\\text{CHO}-(\\text{CHOH})_4-\\text{CH}_2\\text{OH}$, carbons C2, C3, C4, and C5 are chiral centers (total 4)."
  },
  {
    id: "2024-C-55",
    subject: Subject.CHEMISTRY,
    section: Section.B,
    questionNumber: 55,
    questionText: "For the reaction $2A + B \\to C$, the rate law is $\\text{Rate} = k[A]^1[B]^2$. The overall order of the reaction is _____.",
    correctAnswer: "3",
    topic: "Chemical Kinetics",
    difficulty: "Easy",
    explanation: "Overall order is the sum of powers of concentration terms in rate law: $1 + 2 = 3$."
  },
  {
    id: "2024-C-56",
    subject: Subject.CHEMISTRY,
    section: Section.B,
    questionNumber: 56,
    questionText: "The mass of anhydrous $\\text{NaOH}$ (molar mass $40\\text{ g/mol}$) needed to prepare $250\\text{ mL}$ of a $0.5\\text{ M}$ solution is _____ grams.",
    correctAnswer: "5",
    topic: "Solutions",
    difficulty: "Easy",
    explanation: "$$\\text{Moles} = M \\times V(\\text{L}) = 0.5 \\times 0.250 = 0.125\\text{ mol}$$.\n$$\\text{Mass} = 0.125 \\times 40 = 5.0\\text{ g}$$."
  },
  {
    id: "2024-C-57",
    subject: Subject.CHEMISTRY,
    section: Section.B,
    questionNumber: 57,
    questionText: "The coordination number of $\\text{Cs}^+$ ion in $\\text{CsCl}$ lattice is _____.",
    correctAnswer: "8",
    topic: "Solid State",
    difficulty: "Easy",
    explanation: "$\\text{CsCl}$ crystallizes in a body-centered cubic type arrangement where each $\\text{Cs}^+$ ion is surrounded by 8 $\\text{Cl}^-$ ions."
  },
  {
    id: "2024-C-58",
    subject: Subject.CHEMISTRY,
    section: Section.B,
    questionNumber: 58,
    questionText: "The oxidation state of sulfur in Caro's acid ($\\text{H}_2\\text{SO}_5$) is _____.",
    correctAnswer: "6",
    topic: "p-Block Elements",
    difficulty: "Easy",
    explanation: "Caro's acid contains one peroxo linkage $(-\\text{O-O}-)$. Structure is $\\text{HO}-\\text{SO}_2-\\text{O-OH}$. Oxidation state of S is $+6$."
  },
  {
    id: "2024-C-59",
    subject: Subject.CHEMISTRY,
    section: Section.B,
    questionNumber: 59,
    questionText: "The number of sigma ($\\sigma$) bonds in one molecule of benzene ($\\text{C}_6\\text{H}_6$) is _____.",
    correctAnswer: "12",
    topic: "General Organic Chemistry",
    difficulty: "Easy",
    explanation: "Benzene has 6 $\\text{C-C}$ $\\sigma$-bonds in the ring and 6 $\\text{C-H}$ $\\sigma$-bonds, giving a total of $6 + 6 = 12$ $\\sigma$-bonds."
  },
  {
    id: "2024-C-60",
    subject: Subject.CHEMISTRY,
    section: Section.B,
    questionNumber: 60,
    questionText: "The value of $\\Delta H$ for a reaction is $-100\\text{ kJ}$ and $\\Delta S$ is $-200\\text{ J/K}$. The temperature at which this reaction is in equilibrium is _____ K.",
    correctAnswer: "500",
    topic: "Chemical Thermodynamics",
    difficulty: "Easy",
    explanation: "At equilibrium, $\\Delta G = 0 \\implies T = \\frac{\\Delta H}{\\Delta S} = \\frac{-100000\\text{ J}}{-200\\text{ J/K}} = 500\\text{ K}$."
  },

  // ==========================================
  // MATHEMATICS (Questions 61 - 90)
  // Section A: Q61 - Q80 (MCQ)
  // Section B: Q81 - Q90 (NAT, Attempt any 5 of 10 - Legacy 2024 Pattern)
  // ==========================================
  {
    id: "2024-M-61",
    subject: Subject.MATHEMATICS,
    section: Section.A,
    questionNumber: 61,
    questionText: "If $f(x) = \\begin{cases} \\frac{\\sin 5x}{x}, & x \\neq 0 \\\\ k, & x = 0 \\end{cases}$ is continuous at $x = 0$, then the value of $k$ is:",
    options: [
      "5",
      "1",
      "0",
      "1/5"
    ],
    correctAnswer: "A",
    topic: "Limits, Continuity and Differentiability",
    difficulty: "Easy",
    explanation: "$$\\lim_{x \\to 0} f(x) = \\lim_{x \\to 0} \\frac{\\sin 5x}{x} = 5 \\cdot \\lim_{x \\to 0} \\frac{\\sin 5x}{5x} = 5$$.\nFor continuity, $k = f(0) = \\lim_{x \\to 0} f(x) = 5$."
  },
  {
    id: "2024-M-62",
    subject: Subject.MATHEMATICS,
    section: Section.A,
    questionNumber: 62,
    questionText: "The value of the determinant $\\begin{vmatrix} 1 & a & b+c \\\\ 1 & b & c+a \\\\ 1 & c & a+b \\end{vmatrix}$ is:",
    options: [
      "0",
      "$a + b + c$",
      "$(a - b)(b - c)(c - a)$",
      "1"
    ],
    correctAnswer: "A",
    topic: "Matrices and Determinants",
    difficulty: "Easy",
    explanation: "Apply column operation $C_3 \\to C_3 + C_2$. The third column becomes identical to $(a + b + c) \\begin{pmatrix} 1 \\\\ 1 \\\\ 1 \\end{pmatrix}$, making $C_3$ proportional to $C_1$. Hence determinant is 0."
  },
  {
    id: "2024-M-63",
    subject: Subject.MATHEMATICS,
    section: Section.A,
    questionNumber: 63,
    questionText: "The sum of the series $1 + 2 + 3 + \\dots + 50$ is:",
    options: [
      "1275",
      "1250",
      "1300",
      "1225"
    ],
    correctAnswer: "A",
    topic: "Sequences and Series",
    difficulty: "Easy",
    explanation: "$$S_n = \\frac{n(n + 1)}{2} = \\frac{50 \\times 51}{2} = 25 \\times 51 = 1275$$."
  },
  {
    id: "2024-M-64",
    subject: Subject.MATHEMATICS,
    section: Section.A,
    questionNumber: 64,
    questionText: "The derivative of $\\tan^{-1}\\left(\\frac{2x}{1 - x^2}\\right)$ with respect to $\\sin^{-1}\\left(\\frac{2x}{1 + x^2}\\right)$ for $|x| < 1$ is:",
    options: [
      "1",
      "2",
      "1/2",
      "0"
    ],
    correctAnswer: "A",
    topic: "Limits, Continuity and Differentiability",
    difficulty: "Easy",
    explanation: "For $|x| < 1$, both functions simplify to $2\\tan^{-1} x$.\nLet $u = 2\\tan^{-1} x$ and $v = 2\\tan^{-1} x$. Therefore $\\frac{du}{dv} = 1$."
  },
  {
    id: "2024-M-65",
    subject: Subject.MATHEMATICS,
    section: Section.A,
    questionNumber: 65,
    questionText: "The equation of circle with center at $(0, 0)$ and touching the line $3x + 4y = 15$ is:",
    options: [
      "$x^2 + y^2 = 9$",
      "$x^2 + y^2 = 16$",
      "$x^2 + y^2 = 25$",
      "$x^2 + y^2 = 5$"
    ],
    correctAnswer: "A",
    topic: "Circle",
    difficulty: "Easy",
    explanation: "Radius $r$ equals the perpendicular distance from center $(0,0)$ to the tangent line:\n$$r = \\frac{|3(0) + 4(0) - 15|}{\\sqrt{3^2 + 4^2}} = \\frac{15}{5} = 3$$.\nEquation: $x^2 + y^2 = 3^2 = 9$."
  },
  {
    id: "2024-M-66",
    subject: Subject.MATHEMATICS,
    section: Section.A,
    questionNumber: 66,
    questionText: "The integral $\\int \\frac{dx}{x^2 + 9}$ is equal to:",
    options: [
      "$\\frac{1}{3}\\tan^{-1}\\left(\\frac{x}{3}\\right) + C$",
      "$\\frac{1}{9}\\tan^{-1}\\left(\\frac{x}{3}\\right) + C$",
      "$\\tan^{-1}\\left(\\frac{x}{3}\\right) + C$",
      "$\\frac{1}{3}\\log|x + 3| + C$"
    ],
    correctAnswer: "A",
    topic: "Indefinite Integrals",
    difficulty: "Easy",
    explanation: "Standard formula $\\int \\frac{dx}{x^2 + a^2} = \\frac{1}{a}\\tan^{-1}\\left(\\frac{x}{a}\\right) + C$. Here $a = 3$, giving $\\frac{1}{3}\\tan^{-1}\\left(\\frac{x}{3}\\right) + C$."
  },
  {
    id: "2024-M-67",
    subject: Subject.MATHEMATICS,
    section: Section.A,
    questionNumber: 67,
    questionText: "If $\\vec{a} = \\hat{i} + \\hat{j} + \\hat{k}$ and $\\vec{b} = 2\\hat{i} - \\hat{j} + 3\\hat{k}$, then the dot product $\\vec{a}\\cdot\\vec{b}$ is:",
    options: [
      "4",
      "5",
      "6",
      "3"
    ],
    correctAnswer: "A",
    topic: "Vector Algebra",
    difficulty: "Easy",
    explanation: "$$\\vec{a}\\cdot\\vec{b} = (1)(2) + (1)(-1) + (1)(3) = 2 - 1 + 3 = 4$$."
  },
  {
    id: "2024-M-68",
    subject: Subject.MATHEMATICS,
    section: Section.A,
    questionNumber: 68,
    questionText: "The order and degree of the differential equation $\\left(\\frac{d^2 y}{dx^2}\\right)^2 + \\left(\\frac{dy}{dx}\\right)^3 + y = 0$ are respectively:",
    options: [
      "2 and 2",
      "2 and 3",
      "3 and 2",
      "1 and 3"
    ],
    correctAnswer: "A",
    topic: "Differential Equations",
    difficulty: "Easy",
    explanation: "Highest derivative is second derivative $\\frac{d^2y}{dx^2}$, so order is 2. The exponent of this highest derivative term is 2, so degree is 2."
  },
  {
    id: "2024-M-69",
    subject: Subject.MATHEMATICS,
    section: Section.A,
    questionNumber: 69,
    questionText: "The focus of the parabola $y^2 = -8x$ is at:",
    options: [
      "$(-2, 0)$",
      "$(2, 0)$",
      "$(0, -2)$",
      "$(0, 2)$"
    ],
    correctAnswer: "A",
    topic: "Parabola",
    difficulty: "Easy",
    explanation: "Comparing with $y^2 = -4ax$: $4a = 8 \\implies a = 2$. Focus is $(-a, 0) = (-2, 0)$."
  },
  {
    id: "2024-M-70",
    subject: Subject.MATHEMATICS,
    section: Section.A,
    questionNumber: 70,
    questionText: "If $\\sin\\theta = 3/5$ and $\\theta$ lies in the first quadrant, then the value of $\\cos 2\\theta$ is:",
    options: [
      "7/25",
      "24/25",
      "16/25",
      "9/25"
    ],
    correctAnswer: "A",
    topic: "Trigonometry",
    difficulty: "Easy",
    explanation: "$$\\cos 2\\theta = 1 - 2\\sin^2\\theta = 1 - 2\\left(\\frac{3}{5}\\right)^2 = 1 - 2\\left(\\frac{9}{25}\\right) = 1 - \\frac{18}{25} = \\frac{7}{25}$$."
  },
  {
    id: "2024-M-71",
    subject: Subject.MATHEMATICS,
    section: Section.A,
    questionNumber: 71,
    questionText: "The 7th term in the expansion of $(x + 2)^{10}$ is:",
    options: [
      "$\\binom{10}{6} x^4 (2)^6$",
      "$\\binom{10}{7} x^3 (2)^7$",
      "$\\binom{10}{6} x^6 (2)^4$",
      "$\\binom{10}{5} x^5 (2)^5$"
    ],
    correctAnswer: "A",
    topic: "Binomial Theorem",
    difficulty: "Easy",
    explanation: "General term $T_{r+1} = \\binom{n}{r} a^{n-r} b^r$. For $T_7$, $r = 6$:\n$$T_7 = \\binom{10}{6} x^{10-6} (2)^6 = \\binom{10}{6} x^4 (2)^6$$."
  },
  {
    id: "2024-M-72",
    subject: Subject.MATHEMATICS,
    section: Section.A,
    questionNumber: 72,
    questionText: "The mean of the numbers $2, 4, 6, 8, 10$ is:",
    options: [
      "6",
      "5",
      "7",
      "8"
    ],
    correctAnswer: "A",
    topic: "Statistics",
    difficulty: "Easy",
    explanation: "$$\\bar{x} = \\frac{2 + 4 + 6 + 8 + 10}{5} = \\frac{30}{5} = 6$$."
  },
  {
    id: "2024-M-73",
    subject: Subject.MATHEMATICS,
    section: Section.A,
    questionNumber: 73,
    questionText: "The direction cosines of the vector $\\vec{v} = 2\\hat{i} + 3\\hat{j} + 6\\hat{k}$ are:",
    options: [
      "$\\frac{2}{7}, \\frac{3}{7}, \\frac{6}{7}$",
      "$\\frac{2}{11}, \\frac{3}{11}, \\frac{6}{11}$",
      "$\\frac{2}{\\sqrt{47}}, \\frac{3}{\\sqrt{47}}, \\frac{6}{\\sqrt{47}}$",
      "$2, 3, 6$"
    ],
    correctAnswer: "A",
    topic: "Three Dimensional Geometry",
    difficulty: "Easy",
    explanation: "Magnitude $|\\vec{v}| = \\sqrt{2^2 + 3^2 + 6^2} = \\sqrt{4 + 9 + 36} = \\sqrt{49} = 7$.\nDirection cosines are $\\frac{2}{7}, \\frac{3}{7}, \\frac{6}{7}$."
  },
  {
    id: "2024-M-74",
    subject: Subject.MATHEMATICS,
    section: Section.A,
    questionNumber: 74,
    questionText: "If events $A$ and $B$ are independent with $P(A) = 0.4$ and $P(B) = 0.5$, then $P(A \\cup B)$ is:",
    options: [
      "0.70",
      "0.90",
      "0.20",
      "0.60"
    ],
    correctAnswer: "A",
    topic: "Probability",
    difficulty: "Easy",
    explanation: "For independent events: $P(A \\cap B) = P(A)P(B) = 0.4 \\times 0.5 = 0.20$.\n$$P(A \\cup B) = P(A) + P(B) - P(A \\cap B) = 0.4 + 0.5 - 0.20 = 0.70$$."
  },
  {
    id: "2024-M-75",
    subject: Subject.MATHEMATICS,
    section: Section.A,
    questionNumber: 75,
    questionText: "The area of the region bounded by $y = \\sin x$ and the x-axis from $x = 0$ to $x = \\pi$ is:",
    options: [
      "2 sq units",
      "1 sq units",
      "$\\pi$ sq units",
      "4 sq units"
    ],
    correctAnswer: "A",
    topic: "Area under Curves",
    difficulty: "Easy",
    explanation: "$$\\text{Area} = \\int_0^\\pi \\sin x\\,dx = [-\\cos x]_0^\\pi = -(-1 - 1) = 2\\text{ sq units}$$."
  },
  {
    id: "2024-M-76",
    subject: Subject.MATHEMATICS,
    section: Section.A,
    questionNumber: 76,
    questionText: "If $\\begin{pmatrix} 1 & 0 \\\\ 0 & 1 \\end{pmatrix}$ is the identity matrix $I$, then $I^5$ is:",
    options: [
      "$I$",
      "$5I$",
      "$O$",
      "$25I$"
    ],
    correctAnswer: "A",
    topic: "Matrices and Determinants",
    difficulty: "Easy",
    explanation: "For any identity matrix, $I^n = I$ for all positive integers $n$."
  },
  {
    id: "2024-M-77",
    subject: Subject.MATHEMATICS,
    section: Section.A,
    questionNumber: 77,
    questionText: "The principal value of $\\sin^{-1}\\left(\\sin\\frac{2\\pi}{3}\\right)$ is:",
    options: [
      "$\\pi/3$",
      "$2\\pi/3$",
      "$-\\pi/3$",
      "$4\\pi/3$"
    ],
    correctAnswer: "A",
    topic: "Inverse Trigonometric Functions",
    difficulty: "Easy",
    explanation: "The principal range of $\\sin^{-1} x$ is $[-\\pi/2, \\pi/2]$.\n$$\\sin\\left(\\frac{2\\pi}{3}\\right) = \\sin\\left(\\pi - \\frac{\\pi}{3}\\right) = \\sin\\frac{\\pi}{3}$$.\nHence $\\sin^{-1}\\left(\\sin\\frac{2\\pi}{3}\\right) = \\frac{\\pi}{3}$."
  },
  {
    id: "2024-M-78",
    subject: Subject.MATHEMATICS,
    section: Section.A,
    questionNumber: 78,
    questionText: "The minimum value of $f(x) = x^2 - 4x + 7$ is:",
    options: [
      "3",
      "7",
      "2",
      "-3"
    ],
    correctAnswer: "A",
    topic: "Application of Derivatives",
    difficulty: "Easy",
    explanation: "$$f(x) = (x - 2)^2 - 4 + 7 = (x - 2)^2 + 3$$.\nSince $(x - 2)^2 \\ge 0$, minimum value is 3 at $x = 2$."
  },
  {
    id: "2024-M-79",
    subject: Subject.MATHEMATICS,
    section: Section.A,
    questionNumber: 79,
    questionText: "The slope of the line $2x + 3y = 6$ is:",
    options: [
      "-2/3",
      "2/3",
      "-3/2",
      "2"
    ],
    correctAnswer: "A",
    topic: "Straight Lines",
    difficulty: "Easy",
    explanation: "Rewriting in slope-intercept form: $3y = -2x + 6 \\implies y = -\\frac{2}{3}x + 2$. Slope $m = -2/3$."
  },
  {
    id: "2024-M-80",
    subject: Subject.MATHEMATICS,
    section: Section.A,
    questionNumber: 80,
    questionText: "The value of $\\log_2 64$ is:",
    options: [
      "6",
      "8",
      "5",
      "32"
    ],
    correctAnswer: "A",
    topic: "Quadratic Equations",
    difficulty: "Easy",
    explanation: "$$2^6 = 64 \\implies \\log_2 64 = 6$$."
  },

  // Mathematics Section B (NAT - Q81 to Q90, Attempt Any 5)
  {
    id: "2024-M-81",
    subject: Subject.MATHEMATICS,
    section: Section.B,
    questionNumber: 81,
    questionText: "The sum of the roots of the equation $2x^2 - 8x + 5 = 0$ is _____.",
    correctAnswer: "4",
    topic: "Quadratic Equations",
    difficulty: "Easy",
    explanation: "Sum of roots $= -b/a = -(-8)/2 = 8/2 = 4$."
  },
  {
    id: "2024-M-82",
    subject: Subject.MATHEMATICS,
    section: Section.B,
    questionNumber: 82,
    questionText: "The value of $\\lim_{x \\to 0} \\frac{\\sin 4x}{x}$ is _____.",
    correctAnswer: "4",
    topic: "Limits, Continuity and Differentiability",
    difficulty: "Easy",
    explanation: "$$\\lim_{x \\to 0} \\frac{\\sin 4x}{x} = 4 \\lim_{x \\to 0} \\frac{\\sin 4x}{4x} = 4 \\times 1 = 4$$."
  },
  {
    id: "2024-M-83",
    subject: Subject.MATHEMATICS,
    section: Section.B,
    questionNumber: 83,
    questionText: "If $\\begin{pmatrix} x & 3 \\\\ 1 & 2 \\end{pmatrix}$ has determinant equal to 7, the value of $x$ is _____.",
    correctAnswer: "5",
    topic: "Matrices and Determinants",
    difficulty: "Easy",
    explanation: "$$|A| = 2x - 3 = 7 \\implies 2x = 10 \\implies x = 5$$."
  },
  {
    id: "2024-M-84",
    subject: Subject.MATHEMATICS,
    section: Section.B,
    questionNumber: 84,
    questionText: "The length of the major axis of the ellipse $\\frac{x^2}{25} + \\frac{y^2}{9} = 1$ is _____.",
    correctAnswer: "10",
    topic: "Ellipse",
    difficulty: "Easy",
    explanation: "$$a^2 = 25 \\implies a = 5$$. Length of major axis $= 2a = 2(5) = 10$."
  },
  {
    id: "2024-M-85",
    subject: Subject.MATHEMATICS,
    section: Section.B,
    questionNumber: 85,
    questionText: "The number of ways to arrange the letters of the word 'MATH' is _____.",
    correctAnswer: "24",
    topic: "Permutations and Combinations",
    difficulty: "Easy",
    explanation: "All 4 letters are distinct: $4! = 4 \\times 3 \\times 2 \\times 1 = 24$."
  },
  {
    id: "2024-M-86",
    subject: Subject.MATHEMATICS,
    section: Section.B,
    questionNumber: 86,
    questionText: "The value of $\\int_0^2 (3x^2 + 2x)\\,dx$ is _____.",
    correctAnswer: "12",
    topic: "Definite Integrals",
    difficulty: "Easy",
    explanation: "$$\\left[x^3 + x^2\\right]_0^2 = (2^3 + 2^2) - 0 = 8 + 4 = 12$$."
  },
  {
    id: "2024-M-87",
    subject: Subject.MATHEMATICS,
    section: Section.B,
    questionNumber: 87,
    questionText: "If $\\vec{a}$ is a vector of magnitude 5 and $\\vec{b}$ is a vector of magnitude 4 with $\\vec{a}\\cdot\\vec{b} = 10$, then the angle between them is _____ degrees.",
    correctAnswer: "60",
    topic: "Vector Algebra",
    difficulty: "Easy",
    explanation: "$$\\cos\\theta = \\frac{\\vec{a}\\cdot\\vec{b}}{|\\vec{a}||\\vec{b}|} = \\frac{10}{5 \\times 4} = \\frac{10}{20} = \\frac{1}{2} \\implies \\theta = 60^\\circ$$."
  },
  {
    id: "2024-M-88",
    subject: Subject.MATHEMATICS,
    section: Section.B,
    questionNumber: 88,
    questionText: "The slope of normal to the curve $y = 2x^2 + 3x$ at $x = 0$ is $-1/k$. The value of $k$ is _____.",
    correctAnswer: "3",
    topic: "Application of Derivatives",
    difficulty: "Easy",
    explanation: "$$\\frac{dy}{dx} = 4x + 3$$. At $x = 0$, $m_{\\text{tangent}} = 3$.\nSlope of normal $m_{\\text{normal}} = -\\frac{1}{3} = -\\frac{1}{k} \\implies k = 3$."
  },
  {
    id: "2024-M-89",
    subject: Subject.MATHEMATICS,
    section: Section.B,
    questionNumber: 89,
    questionText: "The coefficient of $x^2$ in the expansion of $(1 + 2x)^5$ is _____.",
    correctAnswer: "40",
    topic: "Binomial Theorem",
    difficulty: "Easy",
    explanation: "Term containing $x^2$ is $\\binom{5}{2} (2x)^2 = 10 \\times 4x^2 = 40x^2$. Coefficient is 40."
  },
  {
    id: "2024-M-90",
    subject: Subject.MATHEMATICS,
    section: Section.B,
    questionNumber: 90,
    questionText: "The distance from the origin $(0, 0, 0)$ to the plane $2x - 3y + 6z - 14 = 0$ is _____ units.",
    correctAnswer: "2",
    topic: "Three Dimensional Geometry",
    difficulty: "Easy",
    explanation: "$$d = \\frac{|-14|}{\\sqrt{2^2 + (-3)^2 + 6^2}} = \\frac{14}{\\sqrt{4 + 9 + 36}} = \\frac{14}{\\sqrt{49}} = \\frac{14}{7} = 2$$."
  }
];
