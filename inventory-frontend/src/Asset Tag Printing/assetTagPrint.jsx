import { QRCodeCanvas } from "qrcode.react";
import { useRef, useState } from "react";

const EXCLUDED_FIELDS = [
  "created_at",
  "created_by",
  "updated_at",
  "updated_by",
  "status"  
];

const buildQrPayload = (row) => {
  const lines = [];

  Object.entries(row).forEach(([key, value]) => {
    if (!EXCLUDED_FIELDS.includes(key) && value != null && value !== "") {
      const label = key
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      lines.push(`${label}: ${value}`);
    }
  });
  return lines.join("\n");
};

function AssetTagPrint({ row }) {
  const [open, setOpen] = useState(false);
  const qrRef = useRef(null);

  if (!row) return null;

  const handlePrint = () => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;

    const qrImage = canvas.toDataURL("image/png");
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.body.innerHTML = `
      <html>
        <head>
          <title>Asset Tag</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
              background: #f0f0f0;
            }
            .tag {
              width: 200px;
              border: 2px solid black;
              padding: 5px;
              text-align: center;
              margin: 20px auto;
              background: white;
            }
            h3 {
              font-size: 14px;
              font-weight: bold;
            }
            img {
              max-width: 200px;
              display: block;
            }
            .asset-id {
              font-weight: bold;
              font-size: 18px;
            }
          </style>
        </head>
        <body>
          <div class="tag">
            <h3>
              PLEASE DO NOT REMOVE!<br/>
              PROPERTY OF LXII
            </h3>

            <img src="${qrImage}" alt="QR Code" />

            <div class="asset-id">
              ${row.asset_tag || "ASSET TAG"}
            </div>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `;

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  };

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setOpen(true)}
        className="px-5 py-2 bg-blue-600 text-white rounded-lg cursor-pointer"
      >
        View QR Code
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-xl p-6 w-[320px] shadow-xl text-center">
            <h3 className="font-semibold mb-4">Asset QR Code</h3>

            <div ref={qrRef} className="flex justify-center mb-6">
              <QRCodeCanvas
                value={buildQrPayload(row)}
                size={200}
                includeMargin
              />
            </div>

            <div className="flex justify-between gap-2">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 bg-gray-400 text-white rounded-lg"
              >
                Close
              </button>

              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
              >
                Print Asset Tag
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AssetTagPrint;