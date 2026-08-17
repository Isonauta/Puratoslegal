const videos = [
  {
    title: "Introducción al SST",
    description: "Conceptos fundamentales de Seguridad y Salud en el Trabajo.",
  },
  {
    title: "Qué es un Permiso de Trabajo Seguro",
    description: "Aprende a identificar y aplicar procedimientos seguros en tu área.",
  },
  {
    title: "Pasos para aplicar un PTS",
    description: "Guía paso a paso para completar un Permiso de Trabajo Seguro.",
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
          <div
            key={v.title}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col"
          >
            <div className="bg-gray-100 aspect-video flex items-center justify-center">
              <div className="text-center px-4">
                <div className="w-12 h-12 rounded-full bg-[#C41230] flex items-center justify-center mx-auto mb-2">
                  <svg className="w-5 h-5 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                </div>
                <p className="text-xs text-gray-400">Próximamente</p>
              </div>
            </div>
            <div className="p-4 flex flex-col gap-1">
              <p className="font-semibold text-sm text-gray-800">{v.title}</p>
              <p className="text-xs text-gray-500">{v.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
