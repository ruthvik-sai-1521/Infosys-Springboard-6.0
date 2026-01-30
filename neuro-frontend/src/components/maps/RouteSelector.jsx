import React from 'react';
import { Clock, Navigation, Zap } from 'lucide-react';

const RouteSelector = ({ 
    routes = [], 
    selectedIndex = 0, 
    onRouteSelect, 
    isLoading = false 
}) => {
    if (isLoading) {
        return (
            <div className="space-y-3">
                {[1, 2].map((i) => (
                    <div key={i} className="animate-pulse bg-slate-800 p-4 rounded-lg border border-slate-700 h-24"></div>
                ))}
            </div>
        );
    }

    if (!routes || routes.length === 0) {
        return (
            <div className="text-center p-4 text-gray-400 bg-slate-800 rounded-lg border border-slate-700">
                No routes found
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <Navigation size={20} className="text-blue-500" />
                Select Route
            </h3>
            
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {routes.map((route, index) => {
                    const isSelected = selectedIndex === index;
                    const isFastest = index === 0; // Assuming first route is 'BEST_ROUTE' from backend

                    return (
                        <div
                            key={index}
                            onClick={() => onRouteSelect(index)}
                            className={`
                                relative p-4 rounded-lg cursor-pointer transition-all duration-200 border
                                ${isSelected 
                                    ? 'bg-blue-600/20 border-blue-500 shadow-md ring-1 ring-blue-500/50' 
                                    : 'bg-slate-800 border-slate-700 hover:bg-slate-750 hover:border-slate-600'
                                }
                            `}
                        >
                            {/* Tags */}
                            <div className="absolute top-3 right-3 flex gap-2">
                                {isFastest && (
                                    <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-500/30">
                                        <Zap size={10} fill="currentColor" />
                                        Fastest
                                    </span>
                                )}
                            </div>

                            <div className="flex justify-between items-start mb-1">
                                <h4 className={`font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                                    {route.summary || `Route ${index + 1}`}
                                </h4>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-3">
                                <div className="flex items-center gap-2 text-sm">
                                    <Clock size={16} className={isSelected ? 'text-blue-200' : 'text-gray-500'} />
                                    <span className={isSelected ? 'text-blue-50' : 'text-gray-300'}>
                                        {route.formattedDuration || `${Math.round(route.durationSeconds / 60)} min`}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Navigation size={16} className={isSelected ? 'text-blue-200' : 'text-gray-500'} />
                                    <span className={isSelected ? 'text-blue-50' : 'text-gray-300'}>
                                        {route.formattedDistance || `${(route.distanceMeters / 1000).toFixed(1)} km`}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default RouteSelector;
