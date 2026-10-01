type VideoTitle = { title: string; channelTitle: string };

function normalize(value: string) {
  return value.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

export function rankYouTubeCandidates<T extends VideoTitle>(candidates: T[], name: string, artists: string): T[] {
  const songName = normalize(name);
  const primarySongName = normalize(name.split(/\s*[-–—(（[]/u)[0] ?? "");
  const firstArtist = normalize(artists.split(",")[0] ?? "");

  function score(candidate: T) {
    const title = normalize(candidate.title);
    const channel = normalize(candidate.channelTitle);
    const matchesSong = (Boolean(songName) && title.includes(songName))
      || (primarySongName.length >= 3 && title.includes(primarySongName));
    const matchesArtist = firstArtist && (title.includes(firstArtist) || channel.includes(firstArtist));
    const isMusicVideo = /\b(?:music video|mv|m v)\b|뮤직비디오|ミュージックビデオ/iu.test(title);
    const isOfficial = /\bofficial\b|공식|オフィシャル/iu.test(title);
    const isAlternate = /\b(?:live|lyrics?|cover|reaction|teaser|audio|instrumental|sped up|slowed)\b|라이브|가사|커버/iu.test(title);

    return Number(Boolean(matchesSong)) * 100 + Number(Boolean(matchesArtist)) * 20
      + Number(isMusicVideo) * 20 + Number(isOfficial) * 10 - Number(isAlternate) * 25;
  }

  return candidates
    .map((candidate, index) => ({ candidate, index, score: score(candidate) }))
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .map(({ candidate }) => candidate);
}
