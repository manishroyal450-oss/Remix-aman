import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { MenuItem } from '../data';

const SHEET_ID = '1otN1s4qs_QfF7jfK4uy-uTFOKhflZUXao7vTLrzQBK8';
const SHEET_NAME = 'Restaurant Menu';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`;

export function useMenuData() {
  const [data, setData] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const response = await fetch(`${CSV_URL}&_=${new Date().getTime()}`);
      const csvText = await response.text();
      const parsed = Papa.parse<string[]>(csvText, { skipEmptyLines: true });
      const rows = parsed.data;

      // Filter out rows where name, nativeName, and seqId are all empty
      const validRows = rows.slice(1).filter((columns) => {
        const name = columns[4] ? columns[4].trim() : '';
        const nativeName = columns[3] ? columns[3].trim() : '';
        const seqId = columns[1] ? columns[1].trim() : '';
        return name.length > 0 || nativeName.length > 0 || seqId.length > 0;
      });

      const formattedData: MenuItem[] = validRows.map((columns, index) => {
        const seqId = columns[1] ? columns[1].trim() : '';
        const rawStock = columns[9] ? columns[9].trim() : '';
        const parsedStock = rawStock ? parseInt(rawStock.replace(/[^\d-]/g, ''), 10) : NaN;
        const stock = isNaN(parsedStock) ? 0 : parsedStock;

        const priceFullStr = columns[7] ? columns[7].trim() : '';
        const priceHalfStr = columns[6] ? columns[6].trim() : '';
        const numericPrice =
          parseFloat(priceFullStr && priceFullStr !== '-' ? priceFullStr : (priceHalfStr && priceHalfStr !== '-' ? priceHalfStr : '0')) || 0;

        const rawOffer = columns[8] ? columns[8].trim() : '';
        let discount = 0;
        if (rawOffer) {
          const discountMatch = rawOffer.match(/(\d+)\s*%/);
          if (discountMatch) {
            discount = parseInt(discountMatch[1], 10);
          }
        }

        const youtubeUrl = columns[10] ? columns[10].trim() : '';
        const imageUrlCol = columns[11] ? columns[11].trim() : ((columns as any)['image_url'] || '');

        return {
          id: (index + 1).toString(),
          category: columns[2] ? columns[2].trim() : 'Other',
          nativeName: columns[3] ? columns[3].trim() : '',
          name: columns[4] ? columns[4].trim() : '',
          portion: columns[5] ? columns[5].trim() : '-',
          priceHalf: priceHalfStr,
          priceFull: priceFullStr,
          price: numericPrice,
          offer: rawOffer,
          discount: discount,
          stock: stock,
          gst: 0,
          imageName: seqId,
          image_url: imageUrlCol,
          youtubeVideo: youtubeUrl
        };
      });

      setData(formattedData);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch data');
      setLoading(false);
    }
  };

  const deductStockLocally = (stockMap: Record<string, number>) => {
    setData((prev) =>
      prev.map((item) => {
        if (typeof stockMap[item.id] === 'number') {
          return { ...item, stock: stockMap[item.id] };
        }
        if (typeof stockMap[item.name] === 'number') {
          return { ...item, stock: stockMap[item.name] };
        }
        return item;
      })
    );
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  return { data, loading, error, refresh: fetchData, deductStockLocally };
}
