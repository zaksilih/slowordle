"use client";

export default function InstructionsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl p-6 max-w-sm w-full max-h-[90vh] overflow-y-auto relative border border-gray-700">
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-gray-400 hover:text-white text-2xl leading-none"
          aria-label="Zapri"
        >
          &times;
        </button>

        <h2 className="text-lg font-bold text-center mb-4">Kako igrati</h2>

        <p className="text-sm text-gray-300 mb-4">
          Ugani <strong>BESEDO</strong> v 6 poskusih. Beseda je vedno <strong>samostalnik v imenovalniku ednine</strong>.
        </p>

        <p className="text-sm text-gray-300 mb-3">
          Po vsakem ugibanju se barve ploščic spremenijo in pokažejo, kako uspešen je bil tvoj poskus.
        </p>

        <div className="space-y-4 mb-5">
          <div>
            <div className="flex gap-1 mb-1">
              <Tile letter="M" color="correct" />
              <Tile letter="I" color="absent" />
              <Tile letter="Z" color="absent" />
              <Tile letter="A" color="absent" />
              <Tile letter="R" color="absent" />
            </div>
            <p className="text-xs text-gray-400">
              Črka <strong>M</strong> je v besedi in je na pravem mestu.
            </p>
          </div>

          <div>
            <div className="flex gap-1 mb-1">
              <Tile letter="P" color="absent" />
              <Tile letter="I" color="present" />
              <Tile letter="L" color="absent" />
              <Tile letter="O" color="absent" />
              <Tile letter="T" color="absent" />
            </div>
            <p className="text-xs text-gray-400">
              Črka <strong>I</strong> je v besedi, a na napačnem mestu.
            </p>
          </div>

          <div>
            <div className="flex gap-1 mb-1">
              <Tile letter="T" color="absent" />
              <Tile letter="O" color="absent" />
              <Tile letter="L" color="absent" />
              <Tile letter="A" color="absent" />
              <Tile letter="R" color="absent" />
            </div>
            <p className="text-xs text-gray-400">
              Nobena črka ni v besedi.
            </p>
          </div>
        </div>

        <hr className="border-gray-700 mb-4" />

        <h3 className="text-sm font-bold mb-2">Točkovanje</h3>
        <div className="text-xs text-gray-300 space-y-1 mb-4">
          <div className="flex justify-between"><span>1. poskus</span><span className="font-bold text-green-400">6 točk</span></div>
          <div className="flex justify-between"><span>2. poskus</span><span className="font-bold text-green-400">5 točk</span></div>
          <div className="flex justify-between"><span>3. poskus</span><span className="font-bold text-green-400">4 točke</span></div>
          <div className="flex justify-between"><span>4. poskus</span><span className="font-bold text-yellow-400">3 točke</span></div>
          <div className="flex justify-between"><span>5. poskus</span><span className="font-bold text-yellow-400">2 točki</span></div>
          <div className="flex justify-between"><span>6. poskus</span><span className="font-bold text-orange-400">1 točka</span></div>
          <div className="flex justify-between"><span>Neuspeh</span><span className="font-bold text-red-400">0 točk</span></div>
        </div>

        <p className="text-xs text-gray-500 text-center">
          Vsak dan pride nova uganka!
        </p>
      </div>
    </div>
  );
}

function Tile({ letter, color }: { letter: string; color: "correct" | "present" | "absent" }) {
  const bgClass =
    color === "correct"
      ? "bg-green-600"
      : color === "present"
        ? "bg-yellow-600"
        : "bg-gray-700";

  return (
    <div
      className={`w-10 h-10 ${bgClass} flex items-center justify-center text-white font-bold text-lg rounded border border-gray-600`}
    >
      {letter}
    </div>
  );
}
