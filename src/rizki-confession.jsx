import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";

const TEASING_FACTS = [
  "Katanya sih jutek, tapi pasti senyum-senyum baca ini 😏",
  "Rizki Rusady Rasidah... nama yang panjang banget sih, kayak perasaan aku ke kamu 💀",
  "Serius deh, kamu tuh nyebelin. Masuk pikiran mulu, kaya muat aja padahal ndud 😤",
  "Nggak ada alasan logis kenapa kamu se-menarik itu. Ini nggak adil.",
  "Senyum kamu ilegal. Harus ditangkap atas dakwaan bikin orang susah lupa.",
  "Pangeran tampan ini dibuat terkesima oleh gumpalan lemaknya ayang 💕",
];

export default function App() {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const animFrameRef = useRef(null);
  const particlesRef = useRef(null);
  const heartsRef = useRef([]);

  const [stage, setStage] = useState(0); // 0=intro, 1=teasing, 2=confession, 3=accepted
  const [factIdx, setFactIdx] = useState(0);
  const [noPos, setNoPos] = useState({ x: null, y: null });
  const [showExplosion, setShowExplosion] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [noClicks, setNoClicks] = useState(0);
  const [cursorTrail, setCursorTrail] = useState([]);
  const [showPhoto, setShowPhoto] = useState(false);
  const [, forceUpdate] = useState(0);

  const confessionText =
    "Kiki nduuuuddd... aku suka kamu. Beneran. Bukan karena iseng, bukan karena bosen. Tapi karena kamu itu beda. Dan aku capek pura-pura biasa aja tiap kali lihat kamu. 💕";

  // Three.js setup
  useEffect(() => {
    const w = mountRef.current.clientWidth;
    const h = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
    camera.position.z = 30;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 0);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Particle field
    const particleCount = 400;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 50;
      const c = Math.random();
      if (c < 0.33) {
        colors[i * 3] = 1;
        colors[i * 3 + 1] = 0.2;
        colors[i * 3 + 2] = 0.4;
      } else if (c < 0.66) {
        colors[i * 3] = 1;
        colors[i * 3 + 1] = 0.6;
        colors[i * 3 + 2] = 0.8;
      } else {
        colors[i * 3] = 1;
        colors[i * 3 + 1] = 0.9;
        colors[i * 3 + 2] = 0.4;
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.4,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
    });
    const particles = new THREE.Points(geo, mat);
    scene.add(particles);
    particlesRef.current = particles;

    // Floating heart shapes
    const heartShape = new THREE.Shape();
    heartShape.moveTo(0, 0.5);
    heartShape.bezierCurveTo(0, 1, 1, 1, 1, 0.5);
    heartShape.bezierCurveTo(1, 0, 0, -0.5, 0, -1);
    heartShape.bezierCurveTo(0, -0.5, -1, 0, -1, 0.5);
    heartShape.bezierCurveTo(-1, 1, 0, 1, 0, 0.5);

    const heartGeo = new THREE.ShapeGeometry(heartShape);
    const heartMats = [
      new THREE.MeshBasicMaterial({
        color: 0xff3366,
        transparent: true,
        opacity: 0.6,
      }),
      new THREE.MeshBasicMaterial({
        color: 0xff88aa,
        transparent: true,
        opacity: 0.4,
      }),
      new THREE.MeshBasicMaterial({
        color: 0xffcc00,
        transparent: true,
        opacity: 0.5,
      }),
    ];

    const floatingHearts = [];
    for (let i = 0; i < 15; i++) {
      const mesh = new THREE.Mesh(heartGeo, heartMats[i % 3]);
      const scale = 0.3 + Math.random() * 1.2;
      mesh.scale.set(scale, scale, scale);
      mesh.position.set(
        (Math.random() - 0.5) * 60,
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 10,
      );
      mesh.userData = {
        vx: (Math.random() - 0.5) * 0.02,
        vy: 0.03 + Math.random() * 0.04,
        vr: (Math.random() - 0.5) * 0.01,
        originalY: mesh.position.y,
      };
      scene.add(mesh);
      floatingHearts.push(mesh);
    }
    heartsRef.current = floatingHearts;

    let t = 0;
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      t += 0.005;
      particles.rotation.y = t * 0.1;
      particles.rotation.x = t * 0.05;

      floatingHearts.forEach((h) => {
        h.position.x += h.userData.vx;
        h.position.y += h.userData.vy;
        h.rotation.z += h.userData.vr;
        if (h.position.y > 30) h.position.y = -30;
        if (h.position.x > 40) h.position.x = -40;
        if (h.position.x < -40) h.position.x = 40;
      });

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      const nw = mountRef.current?.clientWidth || w;
      const nh = mountRef.current?.clientHeight || h;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animFrameRef.current);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Typewriter effect
  const typeWriter = useCallback((text, cb) => {
    setTypedText("");
    setIsTyping(true);
    let i = 0;
    const interval = setInterval(() => {
      setTypedText(text.slice(0, i + 1));
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        setIsTyping(false);
        if (cb) cb();
      }
    }, 40);
  }, []);

  // Stage transitions
  useEffect(() => {
    if (stage === 2) {
      typeWriter(confessionText);
    }
    if (stage === 3) {
      setShowPhoto(true);
      const timer = setTimeout(() => {
        setShowPhoto(false);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [stage]);

  // Cursor trail effect
  useEffect(() => {
    let trailId = 0;
    let lastTime = 0;
    const throttleDelay = 50; // ms between each emoji spawn

    const handleMouseMove = (e) => {
      const now = Date.now();
      if (now - lastTime < throttleDelay) return;
      lastTime = now;

      const emoji = ["💕", "💖", "✨", "🌸", "💗"][
        Math.floor(Math.random() * 5)
      ];
      const newTrail = {
        id: trailId++,
        x: e.clientX,
        y: e.clientY,
        emoji: emoji,
        timestamp: Date.now(),
      };

      setCursorTrail((prev) => [...prev.slice(-20), newTrail]);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Remove old cursor trail
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setCursorTrail((prev) =>
        prev.filter((item) => now - item.timestamp < 2500),
      );
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Force re-render for smooth animation
  useEffect(() => {
    const interval = setInterval(() => {
      if (cursorTrail.length > 0) {
        forceUpdate((n) => n + 1);
      }
    }, 16); // ~60fps
    return () => clearInterval(interval);
  }, [cursorTrail.length]);

  const handleNoHover = () => {
    const x = Math.random() * 70;
    const y = Math.random() * 80;
    setNoPos({ x, y });
    setNoClicks((n) => n + 1);
  };

  const handleYes = () => {
    setShowExplosion(true);
    setTimeout(() => {
      setShowExplosion(false);
      setStage(3);
    }, 1200);
  };

  const nextFact = () => {
    if (factIdx < TEASING_FACTS.length - 1) {
      setFactIdx((f) => f + 1);
    } else {
      setStage(2);
    }
  };

  return (
    <div
      className="relative w-full h-screen overflow-hidden bg-black"
      style={{ fontFamily: "'Georgia', serif", cursor: "none" }}
    >
      {/* Background Music - YouTube Embed */}
      <iframe
        className="hidden"
        width="0"
        height="0"
        src="https://www.youtube.com/embed/nRxCB1Bsir0?autoplay=1&loop=1&playlist=nRxCB1Bsir0&controls=0&showinfo=0&rel=0&modestbranding=1"
        title="Natural - D'Masiv"
        allow="autoplay; encrypted-media"
        style={{ display: "none" }}
      />

      {/* Three.js canvas */}
      <div ref={mountRef} className="absolute inset-0 z-0" />

      {/* Gradient overlay */}
      <div
        className="absolute inset-0 z-1"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(20,0,30,0.7) 0%, rgba(0,0,0,0.9) 100%)",
        }}
      />

      {/* Heart rain overlay */}
      <div className="absolute inset-0 z-1 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute text-2xl opacity-20"
            style={{
              left: `${(i * 8.3) % 100}%`,
              animationName: "fall",
              animationDuration: `${4 + (i % 4)}s`,
              animationDelay: `${i * 0.5}s`,
              animationIterationCount: "infinite",
              animationTimingFunction: "linear",
            }}
          >
            {["💕", "💖", "✨", "🌸", "💗"][i % 5]}
          </div>
        ))}
      </div>

      {/* STAGE 0: INTRO */}
      {stage === 0 && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center">
          <div className="mb-4 text-6xl animate-bounce">💌</div>
          <h1
            className="text-5xl md:text-7xl font-bold mb-4"
            style={{
              background: "linear-gradient(135deg, #ff3366, #ff99cc, #ffcc00)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textShadow: "none",
              letterSpacing: "-1px",
            }}
          >
            Psst, Kiki Ndud!
          </h1>
          <p className="text-pink-300 text-xl md:text-2xl mb-2 italic">
            Rizki Rusady Rasidah...
          </p>
          <p className="text-gray-300 text-base md:text-lg mb-10 max-w-md">
            Ada sesuatu yang perlu kamu tau.
            <br />
            <span className="text-yellow-300">
              (Ya, ini buat kamu. Jangan pura-pura nggak tau.)
            </span>
          </p>
          <button
            onClick={() => setStage(1)}
            className="group relative px-10 py-4 rounded-full text-lg font-bold text-black overflow-hidden"
            style={{ background: "linear-gradient(135deg, #ff3366, #ff99cc)" }}
          >
            <span className="relative z-10">Buka deh 👀</span>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
          </button>
          <p
            className="text-red-500 text-xs mt-4 italic font-semibold"
            style={{ animation: "textBlink 1.5s ease-in-out infinite" }}
          >
            *Peringatan: Konten ini mungkin bikin kamu senyum-senyum sendiri
          </p>
        </div>
      )}

      {/* STAGE 1: TEASING */}
      {stage === 1 && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center">
          <div className="relative max-w-lg w-full">
            {/* Card */}
            <div
              className="rounded-3xl p-8 mb-6 border border-pink-500/30"
              style={{
                background: "rgba(255,20,100,0.1)",
                backdropFilter: "blur(10px)",
              }}
            >
              <div className="text-4xl mb-4">😤</div>
              <p
                key={factIdx}
                className="text-white text-xl md:text-2xl font-medium leading-relaxed"
                style={{ animation: "fadeSlideIn 0.5s ease" }}
              >
                {TEASING_FACTS[factIdx]}
              </p>
            </div>

            <div className="flex items-center justify-between text-pink-400 text-sm mb-6 px-2">
              <span>
                {factIdx + 1} dari {TEASING_FACTS.length}
              </span>
              <div className="flex gap-1">
                {TEASING_FACTS.map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all ${i <= factIdx ? "bg-pink-500" : "bg-gray-700"}`}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={nextFact}
              className="w-full py-4 rounded-full font-bold text-white text-lg relative overflow-hidden group"
              style={{
                background: "linear-gradient(135deg, #ff3366, #cc0044)",
              }}
            >
              <span className="relative z-10">
                {factIdx < TEASING_FACTS.length - 1
                  ? "Lanjut... 😏"
                  : "Oke udah deh, serius bentar →"}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
            </button>
          </div>
        </div>
      )}

      {/* STAGE 2: CONFESSION */}
      {stage === 2 && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center">
          <div className="max-w-xl w-full">
            <div
              className="text-5xl mb-6"
              style={{ animation: "pulse 1s ease infinite" }}
            >
              💗
            </div>
            <h2
              className="text-3xl font-bold text-pink-300 mb-6"
              style={{ letterSpacing: "2px" }}
            >
              Oke, serius deh.
            </h2>
            <div
              className="rounded-3xl p-8 mb-8 border border-pink-400/40 text-left"
              style={{
                background: "rgba(255,50,100,0.08)",
                backdropFilter: "blur(16px)",
              }}
            >
              <p className="text-white text-lg md:text-xl leading-relaxed min-h-[100px]">
                {typedText}
                {isTyping && (
                  <span
                    className="inline-block w-1 h-5 bg-pink-400 ml-1"
                    style={{ animation: "blink 0.7s step-end infinite" }}
                  />
                )}
              </p>
            </div>

            {!isTyping && (
              <div
                className="space-y-4"
                style={{ animation: "fadeSlideIn 0.6s ease" }}
              >
                <p className="text-yellow-300 font-bold text-xl mb-6">
                  Jadi... gimana? 👉👈
                </p>
                <div className="relative flex justify-center gap-6 flex-wrap">
                  {/* YES button */}
                  <button
                    onClick={handleYes}
                    className="px-12 py-4 rounded-full font-bold text-xl text-white relative overflow-hidden group"
                    style={{
                      background: "linear-gradient(135deg, #ff3366, #ff0055)",
                      boxShadow: "0 0 30px rgba(255,51,102,0.5)",
                    }}
                  >
                    <span className="relative z-10">Iya dong 💕</span>
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{
                        background: "linear-gradient(135deg, #ff6699, #ff3366)",
                      }}
                    />
                  </button>

                  {/* NO button - runs away! */}
                  <button
                    onMouseEnter={handleNoHover}
                    onTouchStart={handleNoHover}
                    className="px-10 py-4 rounded-full font-bold text-lg text-gray-400 border border-gray-700 transition-all duration-150 cursor-not-allowed select-none"
                    style={
                      noPos.x !== null
                        ? {
                            position: "fixed",
                            left: `${noPos.x}%`,
                            top: `${noPos.y}%`,
                            transform: "translate(-50%, -50%)",
                            zIndex: 100,
                            background: "rgba(30,30,30,0.9)",
                          }
                        : { background: "rgba(30,30,30,0.9)" }
                    }
                  >
                    {noClicks === 0
                      ? "Nggak mau 😤"
                      : noClicks < 3
                        ? "Tangkep dulu~"
                        : noClicks < 6
                          ? "Capek nggak? 😂"
                          : noClicks < 9
                            ? "Udah geh ndud nurut aja jangan nolak!!"
                            : "Hih nolak teros nanti makin pesek!"}
                  </button>
                </div>
                {noClicks > 0 && (
                  <p className="text-pink-400 text-sm italic mt-2">
                    {noClicks < 6
                      ? "Tombol 'nggak mau' nya kabur lho 🏃"
                      : noClicks < 9
                        ? `Udah ${noClicks}x dikejar nggak nyampe-nyampe 💀`
                        : noClicks < 12
                          ? "Udah geh, nurut aja! 😤"
                          : "Hih nolak teroooss makin cipit nanti! 😂"}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STAGE 3: ACCEPTED */}
      {stage === 3 && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center">
          <div className="max-w-lg">
            <div
              className="text-7xl mb-6"
              style={{ animation: "bounceIn 0.6s ease" }}
            >
              🎉💕🎊
            </div>
            <h1
              className="text-5xl md:text-6xl font-bold mb-6"
              style={{
                background:
                  "linear-gradient(135deg, #ffcc00, #ff3366, #ff99cc)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Yeay!! <span style={{ WebkitTextFillColor: "initial" }}>🥹</span>
            </h1>

            <div
              className="rounded-3xl p-8 mb-6 border border-yellow-400/30"
              style={{
                background: "rgba(255,200,0,0.08)",
                backdropFilter: "blur(16px)",
              }}
            >
              <p className="text-white text-xl leading-relaxed">
                Makasih ya, Rizki Rusady Rasidah A.K.A KINDUD 💖
                <br />
                <br />
                Kamu bikin hari-hari jadi lebih berwarna, bahkan di hari yang
                biasa aja.
                <br />
                <br />
                <span className="text-pink-300 font-medium">
                  Ini baru permulaan. 🌸
                </span>
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {["💕", "✨", "🌸", "💗", "🎀", "💫", "🌷", "💝"].map((e, i) => (
                <span
                  key={i}
                  className="text-3xl"
                  style={{
                    animation: `bounceIn ${0.3 + i * 0.1}s ease`,
                    display: "inline-block",
                  }}
                >
                  {e}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* EXPLOSION OVERLAY */}
      {showExplosion && (
        <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute text-3xl"
              style={{
                left: "50%",
                top: "50%",
                animation: `explode${i % 4} 1.2s ease-out forwards`,
                animationDelay: `${i * 0.03}s`,
              }}
            >
              {["💕", "💖", "✨", "🌸", "💗", "⭐"][i % 6]}
            </div>
          ))}
        </div>
      )}

      {/* PHOTO MODAL */}
      {showPhoto && stage === 3 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            style={{ animation: "fadeSlideIn 0.3s ease" }}
          />

          {/* Photo Container */}
          <div
            className="relative z-10"
            style={{ animation: "bounceIn 0.6s ease" }}
          >
            <div
              className="rounded-full overflow-hidden border-4 border-pink-400 shadow-2xl"
              style={{
                width: "300px",
                height: "300px",
                boxShadow: "0 0 60px rgba(255,51,102,0.8)",
              }}
            >
              <img
                src="/ndud.jpeg"
                alt="Kiki Ndud"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Caption */}
            <p
              className="text-center text-pink-300 text-xl font-bold mt-4"
              style={{ animation: "fadeSlideIn 0.8s ease" }}
            >
              Kiki Ndud 💕
            </p>
          </div>
        </div>
      )}

      {/* CURSOR TRAIL OVERLAY */}
      {cursorTrail.map((trail) => {
        const age = Date.now() - trail.timestamp;
        const opacity = Math.max(0, 1 - age / 1500);
        const fallDistance = (age / 1000) * 200; // Falling effect
        const rotation = (age / 10) % 360; // Rotate while falling
        const scale = Math.max(0.5, 1 - age / 3000);

        return (
          <div
            key={trail.id}
            className="fixed pointer-events-none text-xl z-[9999]"
            style={{
              left: trail.x,
              top: trail.y + fallDistance,
              transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`,
              opacity: opacity,
            }}
          >
            {trail.emoji}
          </div>
        );
      })}

      {/* CSS Keyframes injected as style tag */}
      <style>{`
        @keyframes fall {
          0% { transform: translateY(-50px) rotate(0deg); opacity: 0.3; }
          100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
        }
        @keyframes fadeSlideIn {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes textBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes bounceIn {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
        @keyframes explode0 {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
          100% { transform: translate(calc(-50% + ${Math.random() * 400 - 200}px), calc(-50% + ${Math.random() * 400 - 200}px)) scale(1); opacity: 0; }
        }
        @keyframes explode1 {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
          100% { transform: translate(calc(-50% + ${Math.random() * 400 - 200}px), calc(-50% + ${Math.random() * 400 - 200}px)) scale(1); opacity: 0; }
        }
        @keyframes explode2 {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
          100% { transform: translate(calc(-50% + ${Math.random() * 400 - 200}px), calc(-50% + ${Math.random() * 400 - 200}px)) scale(1); opacity: 0; }
        }
        @keyframes explode3 {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
          100% { transform: translate(calc(-50% + ${Math.random() * 400 - 200}px), calc(-50% + ${Math.random() * 400 - 200}px)) scale(1); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
