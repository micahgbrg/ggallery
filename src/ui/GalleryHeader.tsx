interface GalleryHeaderProps {
  title: string;
  logo?: string;
}

export function GalleryHeader({ title, logo }: GalleryHeaderProps) {
  return (
    <header className="fixed top-0 left-0 w-full h-[48px] bg-black/30 backdrop-blur-sm z-40 pointer-events-none flex items-center px-4">
      {logo && (
        <div className="hidden sm:flex flex-1 items-center justify-start pointer-events-auto">
          <img src={logo} alt="Institution Logo" className="max-h-[32px] object-contain" />
        </div>
      )}
      <div className={`${logo ? 'flex-1 text-center sm:text-center' : 'w-full text-center'} pointer-events-auto`}>
        <h1 className="text-white text-sm sm:text-base font-medium truncate drop-shadow-md">
          {title}
        </h1>
      </div>
      {logo && (
        <div className="hidden sm:block flex-1" />
      )}
    </header>
  );
}
