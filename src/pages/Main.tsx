import backgroundImg from '../../public/images/background.jpg';
import flamingoLeftImg from '../../public/images/1per.png';
import flamingoRightImg from '../../public/images/2.png';
import palmImg from '../../public/images/palm.png';
import sandImg from '../../public/images/sand.png';


const Main = () => {
  return (
    <div
      className="relative w-full h-screen bg-cover bg-center"
      style={{
        backgroundImage: `url(${backgroundImg})`
      }}
    >
      {/* Left Palm Tree */}
      <div
        className="absolute left-0 top-0 h-3/4 w-1/4 bg-cover"
        style={{
          backgroundImage: `url(${palmImg})`,
          backgroundPosition: '0 50%;',
          transform: 'scaleX(-1)'
        }}
      />

      {/* Right Palm Tree */}
      <div
        className="absolute right-0 top-0 h-3/4 w-2/5 bg-cover"
        style={{
          backgroundImage: `url(${palmImg})`,
          backgroundPosition: '0 50%;'
        }}
      />
      
      {/* Sand */}
      <div
        className="absolute left-0 bottom-0 h-3/6 w-full bg-cover bg-center"
        style={{
          backgroundImage: `url(${sandImg})`
        }}
      />

      {/* Mint Button */}
    </div>
  );
};

export default Main;
