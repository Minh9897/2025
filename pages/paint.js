import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import Canvas from "components/canvas";
import PromptForm from "components/prompt-form";
import Dropzone from "components/dropzone";
import Download from "components/download";
import { XCircle as StartOverIcon } from "lucide-react";
import { Code as CodeIcon } from "lucide-react";
import { Rocket as RocketIcon } from "lucide-react";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function Home() {
  const [predictions, setPredictions] = useState([]);
  const [error, setError] = useState(null);
  const [userUploadedImage, setUserUploadedImage] = useState(null);
  const [maskImage, setMaskImage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const body = {
        image: userUploadedImage
          ? await readAsDataURL(userUploadedImage)
          : maskImage
            ? predictions[predictions.length - 1]
            : null,
        mask: maskImage,
      };

      const response = await fetch("/api/predictions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (response.status !== 200) {
        const error = await response.json();
        setError(error.detail);
        return;
      }

      // Convert the response blob to data URL
      const prediction = await response.json();
      setPredictions(predictions.concat([prediction]));
      setUserUploadedImage(null);

    } catch (error) {
      setError(error.message);
    }
  };

  const startOver = async (e) => {
    e.preventDefault();
    // Clean up any object URLs we created
    predictions.forEach(pred => {
      if (pred.output && typeof pred.output === 'string' && pred.output.startsWith('blob:')) {
        URL.revokeObjectURL(pred.output);
      }
    });
    setPredictions([]);
    setError(null);
    setMaskImage(null);
    setUserUploadedImage(null);
  };

  return (
    <div>
      <Head>
        <title>Inpainting with Ideogram v2 &amp; Replicate</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>

      <main className="container mx-auto p-5">

        <div className="max-w-[min(1024px,100vw-40px)] mx-auto">
          <PromptForm onSubmit={handleSubmit} />
        </div>


        <div className="border-hairline max-w-[min(1024px,100vw-40px)] mx-auto relative">
          <Dropzone
            onImageDropped={setUserUploadedImage}
            predictions={predictions}
            userUploadedImage={userUploadedImage}
          />
          <div
            className="bg-gray-50 relative w-full flex items-stretch"
            style={{ maxHeight: "min(768px, 100vw - 40px)", aspectRatio: "4 / 3" }}
          >
            <Canvas
              predictions={predictions}
              userUploadedImage={userUploadedImage}
            />
          </div>
        </div>

        <div className="max-w-[min(1024px,100vw-40px)] mx-auto">
          {error && <div className="text-red-700 bg-red-50 p-3 rounded-md mb-5">{error}</div>}

          <div className="text-center">
            {((predictions.length > 0 &&
              predictions[predictions.length - 1].output) ||
              userUploadedImage) && (
                <button className="lil-button" onClick={startOver}>
                  <StartOverIcon className="icon" />
                  Start over
                </button>
              )}

            <Download predictions={predictions} />
          </div>
        </div>
      </main>
    </div>
  );
}

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = reject;
    fr.onload = () => {
      resolve(fr.result);
    };
    fr.readAsDataURL(file);
  });
}