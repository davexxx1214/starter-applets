// Copyright 2024 Google LLC

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { useEffect } from "react";
import { TopBar } from "./TopBar.js";
import { Content } from "./Content.js";
import { AnnotatedImages } from "./AnnotatedImages.js";
import { SideControls } from "./SideControls.js";
import { ExtraModeControls } from "./ExtraModeControls.js";
import { useAtom } from "jotai";
import {
  BumpSessionAtom,
  ImageSrcAtom,
  InitFinishedAtom,
  IsUploadedImageAtom,
} from "./atoms.js";
import { useResetState } from "./hooks.js";
import { safetySettings } from "./consts.js";

function App() {
  const [, setImageSrc] = useAtom(ImageSrcAtom);
  const resetState = useResetState();
  const [initFinished, setInitFinished] = useAtom(InitFinishedAtom);
  const [, setBumpSession] = useAtom(BumpSessionAtom);
  const [, setIsUploadedImage] = useAtom(IsUploadedImageAtom);

  useEffect(() => {
    if (!window.matchMedia("(prefers-color-scheme: dark)").matches) {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return (
    <div className="flex flex-col h-[100dvh]">
      <div className="flex grow overflow-hidden">
        <div className="w-1/5 border-r overflow-auto py-6 px-3">
          <div className="flex flex-col gap-6 items-start">
            <SideControls />
            <AnnotatedImages />
          </div>
        </div>
        <div className="w-3/5 flex flex-col">
          <TopBar />
          <div className="flex grow w-full">
            {initFinished ? <Content /> : null}
          </div>
          <ExtraModeControls />
        </div>
      </div>
    </div>
  );
}

export default App;
