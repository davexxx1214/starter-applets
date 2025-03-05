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

import { useAtom } from "jotai";
import { useResetState } from "./hooks";
import {
  DetectTypeAtom,
  HoverEnteredAtom,
  ModelSelectedAtom,
  RevealOnHoverModeAtom,
  ShowConfigAtom,
} from "./atoms";
import { modelOptions } from "./consts";

export function TopBar() {
  const resetState = useResetState();
  const [revealOnHover, setRevealOnHoverMode] = useAtom(RevealOnHoverModeAtom);
  const [detectType] = useAtom(DetectTypeAtom);
  const [, setHoverEntered] = useAtom(HoverEnteredAtom);
  const [modelSelected, setModelSelected] = useAtom(ModelSelectedAtom);
  const [showConfig,] = useAtom(ShowConfigAtom);

  return (
    <div className="flex w-full items-center px-3 py-2 border-b justify-between">
      <div className="flex gap-3 items-center">
      </div>
      <div className="flex gap-3 items-center">
        {detectType === "2D bounding boxes" ? (
          <div>
            <label className="flex items-center gap-2 px-3 select-none whitespace-nowrap">
              <input
                type="checkbox"
                checked={revealOnHover}
                onChange={(e) => {
                  if (e.target.checked) {
                    setHoverEntered(false);
                  }
                  setRevealOnHoverMode(e.target.checked);
                }}
              />
              <div>悬停显示</div>
            </label>
          </div>
        ) : null}
      </div>
    </div>
  );
}
