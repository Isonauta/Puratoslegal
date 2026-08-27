const videos = [
  {
    title: "Introducción a la SST",
    description: "Conceptos fundamentales de Seguridad y Salud en el Trabajo.",
    youtubeUrl: "https://youtu.be/15RA313884s",
    youtubeId: "15RA313884s",
  },
  {
    title: "Qué es un Permiso de Trabajo Seguro",
    description: "Aprende a identificar y aplicar procedimientos seguros en tu área.",
    youtubeUrl: "https://youtu.be/muTmWODczjU",
    youtubeId: "muTmWODczjU",
  },
  {
    title: "Pasos para aplicar un PTS",
    description: "Guía paso a paso para completar un Permiso de Trabajo Seguro.",
    youtubeUrl: "https://youtu.be/OHbcankLgb8",
    youtubeId: "OHbcankLgb8",
  },
];

export default function VideoSection() {
  return (
    <section>
      <h2 className="text-lg font-bold text-gray-800 mb-4">
        ¿Qué es un Permiso de Trabajo Seguro?
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {videos.map((v) => (
          <a
            key={v.title}
            href={v.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow"
          >
            <div className="relative bg-gray-100 aspect-video overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg`}
                alt={v.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors">
                <div className="w-12 h-12 rounded-full bg-[#C41230] flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="p-4 flex flex-col gap-1">
              <p className="font-semibold text-sm text-gray-800">{v.title}</p>
              <p className="text-xs text-gray-500">{v.description}</p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
