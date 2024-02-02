import "./App.css";
import FsVirtualWaterfall from "./components/FsVirtualWaterfall";

function App() {
  const req = async (tpage: number, size: number) => {
    // 请求，并传入分页参数
    const request = await fetch(
      `https://www.vilipix.com/api/v1/picture/public?limit=${size}&sort=hot&offset=${--tpage * size}`
    );
    // 数据处理
    let {
      data: { rows },
    } = await request.json();
    rows = rows.map((item: any) => ({
      id: item.picture_id,
      width: item.width,
      height: item.height,
      src: item.regular_url + "?x-oss-process=image/resize,w_240/format,jpg",
    }));

    return rows;
  };
  return (
    <div className="flex items-center justify-center w-[100vw] h-[100vh]">
      <div className="w-[70vw] h-[90vh] border-[red] border-1">
        <FsVirtualWaterfall request={req} column={5} pageSize={25} gap={15}>
          {(detail) => (
            <div className="card-item">
              <img src={detail.src} />
            </div>
          )}
        </FsVirtualWaterfall>
      </div>
    </div>
  );
}

export default App;
