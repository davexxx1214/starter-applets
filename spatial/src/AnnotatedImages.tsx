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
import { 
  AnnotatedImagesAtom, 
  ImageSrcAtom, 
  IsUploadedImageAtom, 
  BoundingBoxes2DAtom,
  BoundingBoxes3DAtom,
  PointsAtom,
  DetectTypeAtom,
  ImageSentAtom
} from "./atoms";
import { useResetState } from "./hooks";

export function AnnotatedImages() {
  const [annotatedImages] = useAtom(AnnotatedImagesAtom);
  const [, setImageSrc] = useAtom(ImageSrcAtom);
  const [, setIsUploadedImage] = useAtom(IsUploadedImageAtom);
  const [, setDetectType] = useAtom(DetectTypeAtom);
  const [, setBoundingBoxes2D] = useAtom(BoundingBoxes2DAtom);
  const [, setBoundingBoxes3D] = useAtom(BoundingBoxes3DAtom);
  const [, setPoints] = useAtom(PointsAtom);
  const [, setImageSent] = useAtom(ImageSentAtom);

  return (
    <div className="flex flex-col w-[250px] h-[500px] overflow-y-auto">
      <div className="uppercase mb-2 font-medium">已标注图片</div>
      {annotatedImages.length === 0 ? (
        <div className="text-gray-500 text-sm">暂无已标注图片</div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {annotatedImages.map((image) => (
            <button
              key={image.id}
              className="p-0 w-[110px] h-[110px] relative overflow-hidden"
              onClick={() => {
                setIsUploadedImage(false);
                setImageSrc(image.src);
                
                // 恢复标注结果
                setDetectType(image.type);
                
                // 根据标注类型恢复不同的标注数据
                if (image.type === "2D bounding boxes") {
                  setBoundingBoxes2D(image.annotations as any);
                  setBoundingBoxes3D([]);
                  setPoints([]);
                } else if (image.type === "3D bounding boxes") {
                  setBoundingBoxes3D(image.annotations as any);
                  setBoundingBoxes2D([]);
                  setPoints([]);
                } else if (image.type === "Points") {
                  setPoints(image.annotations as any);
                  setBoundingBoxes2D([]);
                  setBoundingBoxes3D([]);
                }
                
                // 设置图片已标注状态，防止重新标注
                setImageSent(true);
              }}
            >
              <img
                src={image.src}
                alt={`Annotated image ${image.id}`}
                className="absolute left-0 top-0 w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
                {new Date(image.timestamp).toLocaleString()}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
