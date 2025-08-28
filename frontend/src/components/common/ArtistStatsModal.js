import { useState, useEffect } from 'react';

const ArtistStatsModal = ({ isOpen, onClose, concerts }) => {
  const [hoveredArtist, setHoveredArtist] = useState(null);
  const [chartType, setChartType] = useState('pie');

  // Handle escape key press
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

  // Handle modal body scroll prevention
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    
    // Cleanup when component unmounts
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Calculate artist data for pie chart
  const artistData = concerts.map(artist => ({
    name: artist.artistName,
    count: artist.concerts.length,
    id: artist.artistId
  })).sort((a, b) => b.count - a.count);

  const totalConcerts = artistData.reduce((sum, artist) => sum + artist.count, 0);

  // Generate colors for pie slices
  const generateColors = (count) => {
    const colors = [];
    for (let i = 0; i < count; i++) {
      const hue = (i * 360) / count;
      colors.push(`hsl(${hue}, 70%, 60%)`);
    }
    return colors;
  };

  const colors = generateColors(artistData.length);

  // Calculate pie chart data
  const calculatePieData = () => {
    let cumulativePercentage = 0;
    
    return artistData.map((artist, index) => {
      const percentage = (artist.count / totalConcerts) * 100;
      const startAngle = cumulativePercentage * 3.6; // Convert to degrees
      const endAngle = (cumulativePercentage + percentage) * 3.6;
      
      // Calculate path for pie slice - 3x larger
      const radius = 240;
      const centerX = 300;
      const centerY = 300;
      
      const startAngleRad = (startAngle - 90) * (Math.PI / 180);
      const endAngleRad = (endAngle - 90) * (Math.PI / 180);
      
      const x1 = centerX + radius * Math.cos(startAngleRad);
      const y1 = centerY + radius * Math.sin(startAngleRad);
      const x2 = centerX + radius * Math.cos(endAngleRad);
      const y2 = centerY + radius * Math.sin(endAngleRad);
      
      const largeArcFlag = percentage > 50 ? 1 : 0;
      
      const pathData = [
        `M ${centerX} ${centerY}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        'Z'
      ].join(' ');
      
      cumulativePercentage += percentage;
      
      return {
        ...artist,
        percentage,
        pathData,
        color: colors[index]
      };
    });
  };

  const pieData = calculatePieData();

  // Calculate bar chart data with proper sorting
  const sortedArtistData = [...artistData].sort((a, b) => {
    // First priority: Sort by concert count (descending)
    if (a.count !== b.count) {
      return b.count - a.count;
    }
    
    // Second priority: For same concert count, sort by most recent concert date
    const parseEventDate = (dateString) => {
      if (!dateString) return new Date(0);
      
      // Handle different date formats like the PublicProfile component does
      let date;
      
      if (dateString.includes('-')) {
        // Handle formats like "DD-MM-YYYY" or "YYYY-MM-DD"
        const parts = dateString.split('-');
        if (parts.length === 3) {
          if (parts[0].length === 4) {
            // YYYY-MM-DD format - use UTC to avoid timezone offset
            const [year, month, day] = parts;
            date = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
          } else {
            // DD-MM-YYYY format (common in some APIs)
            const [day, month, year] = parts;
            date = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
          }
        } else {
          date = new Date(dateString + 'T00:00:00Z');
        }
      } else {
        date = new Date(dateString + 'T00:00:00Z');
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return new Date(0);
      }
      
      return date;
    };

    const getLatestDate = (artistName) => {
      const artist = concerts.find(c => c.artistName === artistName);
      if (!artist || !artist.concerts || artist.concerts.length === 0) {
        return new Date(0);
      }
      
      let latestDate = new Date(0);
      artist.concerts.forEach(concert => {
        const concertDate = parseEventDate(concert.eventDate);
        if (concertDate > latestDate) {
          latestDate = concertDate;
        }
      });
      
      return latestDate;
    };
    
    const aLatest = getLatestDate(a.name);
    const bLatest = getLatestDate(b.name);
    return bLatest - aLatest; // Most recent first
  });

  const maxCount = Math.max(...sortedArtistData.map(a => a.count));
  const barData = sortedArtistData.map((artist, index) => ({
    ...artist,
    height: (artist.count / maxCount) * 300, // Max height 300px
    color: colors[index]
  }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content artist-stats-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
        <button className="modal-close" onClick={onClose}>×</button>
          <div className="chart-type-selector">
            <button 
              className={`chart-type-btn ${chartType === 'pie' ? 'active' : ''}`}
              onClick={() => setChartType('pie')}
            >
              🥧 Pie Chart
            </button>
            <button 
              className={`chart-type-btn ${chartType === 'bar' ? 'active' : ''}`}
              onClick={() => setChartType('bar')}
            >
              📊 Bar Chart
            </button>
          </div>
          <h2>Artist Distribution</h2>
          </div>
        
        <div className="chart-container">
          {chartType === 'pie' ? (
            <>
              <div className="pie-chart-wrapper">
                <svg width="600" height="600" viewBox="0 0 600 600" style={{overflow: 'visible'}}>
                  {pieData.map((slice, index) => (
                    <path
                      key={slice.id}
                      d={slice.pathData}
                      fill={slice.color}
                      stroke="white"
                      strokeWidth="3"
                      onMouseEnter={() => setHoveredArtist(slice)}
                      onMouseLeave={() => setHoveredArtist(null)}
                      className="pie-slice"
                    />
                  ))}
                </svg>
                
                {hoveredArtist && (
                  <div className="chart-tooltip">
                    <strong>{hoveredArtist.name}</strong><br/>
                    {hoveredArtist.count} concert{hoveredArtist.count !== 1 ? 's' : ''} 
                    ({hoveredArtist.percentage ? hoveredArtist.percentage.toFixed(1) + '%' : ''})
                  </div>
                )}
              </div>
              
              <div className="chart-legend">
                {pieData.map((artist) => (
                  <div 
                    key={artist.id} 
                    className="legend-item"
                    onMouseEnter={() => setHoveredArtist(artist)}
                    onMouseLeave={() => setHoveredArtist(null)}
                  >
                    <div 
                      className="legend-color" 
                      style={{ backgroundColor: artist.color }}
                    ></div>
                    <span className="legend-label">
                      {artist.name} ({artist.count})
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="bar-chart-wrapper">
                <svg width="100%" height="400" viewBox="0 0 1600 400">
                  {barData.map((bar, index) => {
                    const availableWidth = 1500; // Much wider available space
                    const barWidth = Math.max(availableWidth / barData.length - 20, 50);
                    const spacing = barWidth + 20;
                    const x = 50 + index * spacing;
                    const y = 350 - bar.height;
                    
                    return (
                      <g key={bar.id}>
                        <rect
                          x={x}
                          y={y}
                          width={barWidth}
                          height={bar.height}
                          fill={bar.color}
                          stroke="white"
                          strokeWidth="2"
                          onMouseEnter={() => setHoveredArtist(bar)}
                          onMouseLeave={() => setHoveredArtist(null)}
                          className="bar-slice"
                        />
                        <text
                          x={x + barWidth / 2}
                          y={370}
                          textAnchor="middle"
                          fontSize="12"
                          fill="#666"
                          className="bar-label"
                        >
                          {bar.name.length > 10 ? bar.name.substring(0, 8) + '...' : bar.name}
                        </text>
                        <text
                          x={x + barWidth / 2}
                          y={y - 5}
                          textAnchor="middle"
                          fontSize="14"
                          fill="#333"
                          fontWeight="bold"
                        >
                          {bar.count}
                        </text>
                      </g>
                    );
                  })}
                </svg>
                
                {hoveredArtist && (
                  <div className="chart-tooltip">
                    <strong>{hoveredArtist.name}</strong><br/>
                    {hoveredArtist.count} concert{hoveredArtist.count !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        
        <div className="chart-summary">
          <p>Total: {totalConcerts} concerts across {artistData.length} artists</p>
        </div>
      </div>
    </div>
  );
};

export default ArtistStatsModal;